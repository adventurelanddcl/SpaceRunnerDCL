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
import { sendHitSwingBeam } from '../../client/connection'

/** Model used for the swing beam. */
const MODEL = 'models/swingBeam.glb'

/** Pendulum swing half-angle (degrees to each side of centre). */
const SWING_ANGLE = 60

/** Time (ms) for one swing from one extreme to the other. */
const SWING_DURATION = 2000

/** Fallback impulse for a head-on / run-into-the-front hit: relative to the
 * player's facing (upward + backward), matching the bounce stand. */
const IMPULSE_DIRECTION = Vector3.create(0, 4, -10)

/** Strength of the impulse applied to the player on contact (matches bounce stand). */
const IMPULSE_STRENGTH = 20

/** Vertical share of a sideways (swung-into) throw; 0.4 matches the 4/10 ratio above. */
const SIDE_UP_BIAS = 0.4

/** Below this swing speed (units/sec) the beam isn't really sweeping, so a contact
 * is treated as the player running into it (front -> backward). */
const MIN_SWING_SPEED = 1.5

/** If the beam's motion is this aligned (|dot|) with the player's facing, the hit
 * is head-on (front) rather than a side swipe -> backward. */
const HEADON_ALIGNMENT = 0.6

/** Local offset from the pivot to the beam's hit point (also the trigger position). */
const HIT_OFFSET = Vector3.create(0, -4.15, 0)

/** Trigger area covering the beam (swings with it as a parented child). */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(3.25, 1.75, 1.75),
  position: HIT_OFFSET
}

/** Unique id source for each beam's swing-velocity tracking system. */
let beamCounter = 0

/**
 * Rotates the beam back and forth like a pendulum.
 *
 * A single Rotate tween swings from +SWING_ANGLE to -SWING_ANGLE, and an empty
 * TweenSequence with TL_YOYO reverses it forever. EF_EASESINE eases at both
 * extremes for a natural pendulum motion.
 *
 * The swing tween drives the entity's absolute rotation, so the map-defined base
 * rotation is composed in (base * swing). This lets a base rotation (e.g. 90°)
 * turn the whole pendulum, swing plane included.
 */
function startSwinging(entity: Entity, baseRotation: Quaternion) {
  Tween.create(entity, {
    mode: Tween.Mode.Rotate({
      start: Quaternion.multiply(baseRotation, Quaternion.fromEulerDegrees(SWING_ANGLE, 0, 0)),
      end: Quaternion.multiply(baseRotation, Quaternion.fromEulerDegrees(-SWING_ANGLE, 0, 0))
    }),
    duration: SWING_DURATION,
    easingFunction: EasingFunction.EF_EASESINE
  })
  TweenSequence.create(entity, { sequence: [], loop: TweenLoop.TL_YOYO })
}

/**
 * Chooses the impulse based on how the beam struck the player:
 * - Side swipe (beam sweeping across the player's view): throw the player the way
 *   the beam is moving — hit from the right -> thrown left, and vice versa.
 * - Head-on / ran into the front (beam moving along the player's view, or barely
 *   moving): throw the player backward using IMPULSE_DIRECTION.
 *
 * @param swingVelocity The beam hit-point's horizontal velocity (units/sec) in
 *   world space at the moment of contact.
 */
function computeImpulse(swingVelocity: Vector3): Vector3 {
  const backward = () => Transform.localToWorldDirection(engine.PlayerEntity, IMPULSE_DIRECTION)

  // Beam barely moving: the player ran into it -> backward.
  if (Vector3.length(swingVelocity) < MIN_SWING_SPEED) return backward()

  const swingDir = Vector3.normalize(swingVelocity)

  const forward = Transform.localToWorldDirection(engine.PlayerEntity, Vector3.Forward())
  const forwardHoriz = Vector3.create(forward.x, 0, forward.z)
  if (Vector3.lengthSquared(forwardHoriz) < 0.0001) {
    // Player looking straight up/down: can't classify, so throw along the swing.
    return Vector3.create(swingDir.x, SIDE_UP_BIAS, swingDir.z)
  }

  const alignment = Math.abs(Vector3.dot(swingDir, Vector3.normalize(forwardHoriz)))

  // Beam moving along the player's view = head-on (front) -> backward.
  if (alignment >= HEADON_ALIGNMENT) return backward()

  // Side swipe: throw the player in the direction the beam is moving.
  return Vector3.create(swingDir.x, SIDE_UP_BIAS, swingDir.z)
}

/**
 * Creates a swing beam, that swings back and forth and, on contact,
 * deals 1 damage (server-side) and pushes the player away — sideways in the
 * direction the beam is swinging, or backward when run into head-on.
 *
 * @param transform Base transform (position/parent/rotation/scale).
 */
export function createSwingBeam(transform: TransformTypeWithOptionals) {
  const entity = engine.addEntity()
  Transform.create(entity, transform)
  GltfContainer.create(entity, { src: MODEL })

  // Base orientation from the map; the swing is composed on top of it.
  startSwinging(entity, transform.rotation ?? Quaternion.Identity())

  // Track the hit-point's horizontal velocity (units/sec) so onEnter knows which
  // way the beam is swinging at the moment of contact.
  let swingVelocity = Vector3.Zero()
  let lastHit: Vector3 | null = null
  const systemName = `swing-beam-${beamCounter++}`
  engine.addSystem(
    (dt) => {
      const t = Transform.getOrNull(entity)
      if (t === null) {
        engine.removeSystem(systemName)
        return
      }
      // The game area parent is identity, so the entity's local transform is its
      // world transform for direction purposes.
      const hit = Vector3.add(t.position, Vector3.rotate(HIT_OFFSET, t.rotation))
      if (lastHit !== null && dt > 0) {
        swingVelocity = Vector3.create((hit.x - lastHit.x) / dt, 0, (hit.z - lastHit.z) / dt)
      }
      lastHit = Vector3.create(hit.x, hit.y, hit.z)
    },
    undefined,
    systemName
  )

  const onEnter = () => {
    sendHitSwingBeam()
    playOneShotOnPlayer('sounds/bounceTrap.mp3')
    spawnDamageBurst()
    // Throw direction depends on how the beam hit the player (see computeImpulse).
    Physics.applyImpulseToPlayer(computeImpulse(swingVelocity), IMPULSE_STRENGTH)
  }

  // Trigger is parented to the beam, so it swings with it and only hits the
  // player when the beam reaches them.
  createTrigger({ ...TRIGGER_TRANSFORM, parent: entity }, onEnter)
}
