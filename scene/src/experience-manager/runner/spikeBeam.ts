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
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBallTrap } from '../../client/connection'

/** Model used for the spike beam (a ~5.8m bar along its local X axis). */
const MODEL = 'models/spikeBeam.glb'

/** One-shot impact sound played when the beam hits the player. */
const HIT_SOUND = 'sounds/ballHit.mp3'

/** Default travel speed, in units per second (constant across all segments). */
const DEFAULT_SPEED = 4

/** How fast the beam spins about its own long axis, in degrees per second. */
const SPIN_SPEED = 180

/** Knockback strength on contact (same as the ball trap's). */
const IMPULSE_STRENGTH = 25

/** Upward share of the knockback relative to the (unit) horizontal push.
 * Higher = more vertical pop; the horizontal strength stays constant. */
const KNOCKBACK_UP_BIAS = 0.25

/** Damage volume around the beam. Sized to the model's swept shape: its full
 * length on the local X axis, and the spin circle on the other two. Sits on the
 * non-spinning mover so the hazard box stays steady while the beam whirls. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(6, 1.4, 1.4),
  position: Vector3.create(0, 0.06, 0)
}

/**
 * Creates a spike beam: a spinning spiked bar that patrols a looped path.
 *
 * The beam travels between its map-defined waypoints at a constant speed while
 * continuously spinning about its own long axis, so it reads as a rolling spiked
 * roller. Touching it throws the player clear (the same horizontal knockback the
 * ball trap uses) and costs 5 health, applied server-side.
 *
 * Structure mirrors the ball trap: a *mover* entity carries the patrol tween and
 * the trigger area (so the hazard volume follows the beam without spinning), and
 * a *visual* child holds the model and does the spinning. A map-defined
 * `rotation` on the mover aims the beam — the long axis, the trigger box and the
 * spin axis all turn with it.
 *
 * @param transform Base transform (parent/rotation/scale). Position comes from path[0].
 * @param path Looped waypoints the beam travels through, in the parent's local space.
 * @param speed Travel speed in units per second (constant regardless of segment length).
 */
export function createSpikeBeam(
  transform: TransformTypeWithOptionals,
  path: Vector3[],
  speed: number = DEFAULT_SPEED
) {
  const start = path.length > 0 ? path[0] : Vector3.Zero()

  // Mover: carries the patrol tween and the trigger. Holds the map rotation but
  // never spins, so the damage volume stays aligned with the beam's axis.
  const mover = engine.addEntity()
  Transform.create(mover, { ...transform, position: start })

  // Visual: child that holds the model and spins, so the beam whirls without
  // rotating the mover's tween or the trigger area.
  const visual = engine.addEntity()
  Transform.create(visual, { parent: mover })
  GltfContainer.create(visual, { src: MODEL })

  if (path.length > 1) {
    startPatrol(mover, path, speed)
  }
  startSpinning(mover, visual)

  const onEnter = () => {
    // Notify the server so it applies the damage (5) to the player. The amount
    // lives in the server's damage table; the client only reports what hit it.
    sendHitBallTrap()
    playOneShotOnPlayer(HIT_SOUND)
    spawnDamageBurst()

    const beamPosition = getWorldPosition(mover)
    const playerPosition = Transform.get(engine.PlayerEntity).position

    // Flatten the beam->player direction onto the horizontal plane, exactly like
    // the ball trap: a purely 3D direction would waste most of the impulse
    // pushing a standing player into the ground.
    let horizontal = Vector3.create(playerPosition.x - beamPosition.x, 0, playerPosition.z - beamPosition.z)
    if (Vector3.lengthSquared(horizontal) < 0.0001) horizontal = Vector3.Forward()
    horizontal = Vector3.normalize(horizontal)

    // applyImpulseToPlayer normalizes the vector before scaling, so the horizontal
    // strength stays constant and KNOCKBACK_UP_BIAS controls the vertical pop.
    const impulse = Vector3.create(horizontal.x, KNOCKBACK_UP_BIAS, horizontal.z)
    Physics.applyImpulseToPlayer(impulse, IMPULSE_STRENGTH)
  }

  createTrigger({ ...TRIGGER_TRANSFORM, parent: mover }, onEnter)
}

/**
 * Spins the beam's visual about its own long axis (local X) forever.
 *
 * The rotation is set in the mover's local space, so a map-defined rotation on
 * the mover carries the spin axis with it. The system tears itself down once the
 * entity is gone (level teardown removes the whole game-area subtree).
 */
function startSpinning(mover: Entity, visual: Entity) {
  const systemName = `spike-beam-spin-${mover}`
  let angle = 0

  engine.addSystem(
    (dt: number) => {
      const visualTransform = Transform.getMutableOrNull(visual)
      if (visualTransform === null) {
        engine.removeSystem(systemName)
        return
      }
      angle = (angle + SPIN_SPEED * dt) % 360
      visualTransform.rotation = Quaternion.fromAngleAxis(angle, Vector3.Right())
    },
    undefined,
    systemName
  )
}

/**
 * Drives an entity along a looped path using a tween sequence.
 *
 * TL_RESTART replays the initial Tween together with the sequence on every cycle,
 * so for a seamless loop the sequence must end where the initial Tween starts
 * (path[0]). One full cycle is: path[0]->path[1]->...->path[N-1]->path[0], which
 * for a two-point path is a simple there-and-back patrol.
 */
function startPatrol(entity: Entity, path: Vector3[], speed: number) {
  Tween.create(entity, {
    mode: Tween.Mode.Move({ start: path[0], end: path[1] }),
    duration: segmentDuration(path[0], path[1], speed),
    easingFunction: EasingFunction.EF_LINEAR
  })

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
 * Computes an entity's world-space position by composing its local transform up
 * through every parent. The beam's position is local to the game area, while
 * knockback needs a world-space origin to push the player away from. (Same
 * helper as trap.ts — each trap module stays self-contained.)
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
