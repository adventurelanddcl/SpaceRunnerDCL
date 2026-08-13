import { engine, GltfContainer, Physics, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBounce } from '../../client/connection'

/** Model used for the rotation-aimed bounce. */
const MODEL = 'models/bounceTrap.glb'

/** Launch direction in the bounce's local space: straight up. Purely vertical on
 * purpose — the map-defined rotation is then the ONLY source of sideways tilt, so
 * e.g. X=+25 and X=-25 throw perfectly mirrored arcs (a baked-in forward lean like
 * the classic trap's (0,24,4) adds to the tilt one way and cancels it the other,
 * making opposite rotations throw different distances). */
const BASE_DIRECTION = Vector3.create(0, 1, 0)

/** Strength of the impulse applied to the player on contact. */
const IMPULSE_STRENGTH = 35

/** Trigger area covering the pad (matches the classic bounce trap). */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(2.55, 0.6, 2.55),
  position: Vector3.create(0, 0.2, 0)
}

/**
 * Creates a rotation-aimed bounce trap: when the player enters its trigger, they
 * are launched along the trap's own orientation instead of relative to where the
 * player happens to be facing (which is how the classic bounce.ts trap works).
 *
 * Like the boost ring, the map-defined `rotation` aims the launch: an unrotated
 * trap throws up + toward +Z, one rotated 90 on Y throws up + toward +X, and so
 * on. The model and trigger rotate with it, so the throw always matches the visual.
 *
 * @param transform Base transform (position/parent/rotation/scale).
 */
export function createBounceV2(transform: TransformTypeWithOptionals) {
  const entity = engine.addEntity()
  Transform.create(entity, { ...transform })
  GltfContainer.create(entity, { src: MODEL })

  // The launch axis: the local direction turned by the map-defined rotation.
  const direction = Vector3.rotate(BASE_DIRECTION, transform.rotation ?? Quaternion.Identity())

  const onEnter = () => {
    sendHitBounce()
    playOneShotOnPlayer('sounds/bounceTrap.mp3')
    spawnDamageBurst()

    Physics.applyImpulseToPlayer(direction, IMPULSE_STRENGTH)
  }

  createTrigger({ ...TRIGGER_TRANSFORM, parent: entity }, onEnter)
}
