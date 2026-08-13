import {
  engine,
  Entity,
  GltfContainer,
  Physics,
  Transform,
  Tween,
  TweenSequence,
  TweenLoop,
  EasingFunction,
  TransformTypeWithOptionals,
  MeshRenderer
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { attachLoopingSound, playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBallTrap } from '../../client/connection'

/** Continuous rolling sound the player hears when approaching the ball. */
const ROLL_SOUND = 'sounds/rollingBall.mp3'

/** One-shot impact sound played when the ball hits the player. */
const HIT_SOUND = 'sounds/ballHit.mp3'

/**
 * Configuration object used to define the behavior and appearance of a ball trap entity.
 */
type TrapConfig = {
  model: string
  triggerTransform: TransformTypeWithOptionals
  impulseStrength: number
  path: Vector3[]
  speed: number
}

/** Default travel speed, in units per second (constant across all segments). */
const DEFAULT_SPEED = 10
// Upward share of the knockback relative to the (unit) horizontal push.
// Higher = more vertical pop; the horizontal strength stays constant.
const KNOCKBACK_UP_BIAS = 0.25
// Visible radius of the ball, in meters. Used to roll the model without slipping
// (angle = distance / radius). Tune to match the ball model's actual size.
const ROLL_RADIUS = 3.1354


/**
 * Creates a ball trap entity.
 *
 * The ball patrols a looped path and applies an impulse to the player on contact.
 * Movement is driven by an SDK tween on the entity transform (not a baked GLB animation),
 * so the attached trigger area follows the ball as it moves.
 *
 * @param transform Base transform (parent/rotation/scale). Position is taken from path[0].
 * @param path Looped waypoints the ball travels through, in the parent's local space.
 * @param speed Travel speed in units per second (constant regardless of segment length).
 */
export function createBallTrap(
  transform: TransformTypeWithOptionals,
  path: Vector3[],
  speed: number = DEFAULT_SPEED
) {
  createTrapEntity(transform, {
    model: 'models/ball.glb',
    triggerTransform: { scale: Vector3.create(6, 6, 6), position: Vector3.create(0, 0.2, 0) },
    impulseStrength: 25,
    path,
    speed
  })
}

/**
 * Drives an entity along a looped path using a tween sequence.
 *
 * TL_RESTART replays the initial Tween together with the sequence on every cycle,
 * so for a seamless loop the sequence must end where the initial Tween starts
 * (path[0]). One full cycle is: path[0]->path[1]->...->path[N-1]->path[0].
 *
 * Each segment's duration is derived from its length and the desired speed, so the
 * entity moves at a constant velocity across segments of different lengths.
 */
function startPatrol(entity: Entity, path: Vector3[], speed: number) {
  // Lead-in / loop-start segment: first waypoint to second.
  Tween.create(entity, {
    mode: Tween.Mode.Move({ start: path[0], end: path[1] }),
    duration: segmentDuration(path[0], path[1], speed),
    easingFunction: EasingFunction.EF_LINEAR
  })

  // Remaining segments, ending back at path[0] so the initial Tween picks the
  // loop up again without snapping.
  const sequence = []
  for (let i = 1; i < path.length; i++) {
    const from = path[i]
    const to = path[(i + 1) % path.length]
    sequence.push({
      mode: Tween.Mode.Move({ start: from, end: to }),
      duration: segmentDuration(from, to, speed),
      easingFunction: EasingFunction.EF_LINEAR
    })
  }
  TweenSequence.create(entity, { sequence, loop: TweenLoop.TL_RESTART })
}

/** Milliseconds to travel from `a` to `b` at `speed` units/second. */
function segmentDuration(a: Vector3, b: Vector3, speed: number): number {
  return Math.max(1, (Vector3.distance(a, b) / speed) * 1000)
}

/**
 * Rolls a visual entity to match the movement of its (moving) parent.
 *
 * The spin is derived from the parent's actual per-frame displacement, so the ball
 * rolls about the axis perpendicular to its travel and automatically reverses when
 * the patrol path doubles back — exactly like a ball rolling on the ground.
 *
 * The system tears itself down once the entities are removed (e.g. on level switch).
 */
function startRolling(mover: Entity, visual: Entity) {
  const systemName = `ball-roll-${mover}`
  let lastPosition: Vector3 | null = null

  engine.addSystem(
    () => {
      const moverTransform = Transform.getOrNull(mover)
      const visualTransform = Transform.getMutableOrNull(visual)
      if (moverTransform === null || visualTransform === null) {
        engine.removeSystem(systemName)
        return
      }

      const position = moverTransform.position
      if (lastPosition !== null) {
        // Horizontal displacement since last frame.
        const delta = Vector3.create(position.x - lastPosition.x, 0, position.z - lastPosition.z)
        const distance = Vector3.length(delta)
        if (distance > 0.0001) {
          const direction = Vector3.normalize(delta)
          // Rolling axis is horizontal and perpendicular to the direction of travel.
          const axis = Vector3.normalize(Vector3.cross(Vector3.Up(), direction))
          const angle = (distance / ROLL_RADIUS) * (180 / Math.PI)
          const spin = Quaternion.fromAngleAxis(angle, axis)
          // Pre-multiply so the spin is applied in the (world-aligned) parent space.
          visualTransform.rotation = Quaternion.multiply(spin, visualTransform.rotation)
        }
      }
      lastPosition = Vector3.create(position.x, position.y, position.z)
    },
    undefined,
    systemName
  )
}

/**
 * Computes an entity's world-space position by composing its local transform up
 * through every parent. The ball's position is local to the game area, while
 * knockback needs a world-space origin to push the player away from.
 */
function getWorldPosition(entity: Entity): Vector3 {
  const transform = Transform.getOrNull(entity)
  if (transform === null) return Vector3.Zero()

  let position = Vector3.create(transform.position.x, transform.position.y, transform.position.z)
  let parent = transform.parent

  while (parent !== undefined && parent !== engine.RootEntity && Transform.has(parent)) {
    const parentTransform = Transform.get(parent)
    position = Vector3.multiply(position, parentTransform.scale)
    position = Vector3.rotate(position, parentTransform.rotation)
    position = Vector3.add(position, parentTransform.position)
    parent = parentTransform.parent
  }

  return position
}

/**
 * Factory function that creates a ball trap with a moving trigger area.
 *
 * The trigger area is parented to the ball entity, so it tracks the ball's tweened
 * position. When the player enters the trigger, the player is pushed away along the
 * horizontal direction from the ball to the player (backward on a head-on hit,
 * sideways on a side hit) with a constant upward pop. The push is flattened to the
 * horizontal plane so a standing hit (ball center above the player) is just as
 * strong as a mid-air hit at the ball's height.
 */
function createTrapEntity(transform: TransformTypeWithOptionals, config: TrapConfig) {
  const { model, triggerTransform, impulseStrength, path, speed } = config

  // Mover: carries the patrol tween and the trigger area. Stays unrotated.
  const entity = engine.addEntity()
  Transform.create(entity, { ...transform, position: path[0] })
  // Spatial loop on the mover, so the rolling sound tracks the ball's position.
  attachLoopingSound(entity, ROLL_SOUND)

  // Visual: child that holds the model and spins, so the ball rolls without
  // rotating the mover's tween or the trigger area.
  const visual = engine.addEntity()
  Transform.create(visual, { parent: entity })
  MeshRenderer.setBox(visual)
  GltfContainer.create(visual, { src: model })

  if (path.length > 1) {
    startPatrol(entity, path, speed)
    startRolling(entity, visual)
  }

  const onEnter = () => {
    // Notify the server so it can apply damage to the player.
    sendHitBallTrap()
    playOneShotOnPlayer(HIT_SOUND)
    spawnDamageBurst()

    const ballPosition = getWorldPosition(entity)
    const playerPosition = Transform.get(engine.PlayerEntity).position

    // Flatten the ball->player direction onto the horizontal plane. Using the full
    // 3D direction wastes most of the impulse pushing a standing player into the
    // ground (the ball center sits above them); a horizontal direction keeps the
    // push strength identical whether the player is standing or airborne.
    let horizontal = Vector3.create(playerPosition.x - ballPosition.x, 0, playerPosition.z - ballPosition.z)
    if (Vector3.lengthSquared(horizontal) < 0.0001) horizontal = Vector3.Forward()
    horizontal = Vector3.normalize(horizontal)

    // applyImpulseToPlayer normalizes the vector before scaling, so the horizontal
    // strength stays constant and KNOCKBACK_UP_BIAS controls the vertical pop.
    const impulse = Vector3.create(horizontal.x, KNOCKBACK_UP_BIAS, horizontal.z)
    Physics.applyImpulseToPlayer(impulse, impulseStrength)
  }

  createTrigger({ ...triggerTransform, parent: entity }, onEnter)
}
