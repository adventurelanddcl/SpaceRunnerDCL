import { engine, MeshRenderer, GltfContainer, Physics, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { isMobile } from '../../platform'
import { movePlayerTo } from '~system/RestrictedActions'
import { sendHitBounce } from '../../client/connection'

/**
 * Configuration object used to define the behavior and appearance of a bounce entity (trap, stand, etc).
 */
type BounceConfig = {
  model: string
  triggerTransform: TransformTypeWithOptionals
  direction: Vector3
  impulseStrength: number
}

const GRAVITY = -5
const MAX_FLIGHT_SECONDS = 0.33

type MobileThrow = {
  elapsed: number
  start: Vector3
  velocity: Vector3
}
const activeThrows: MobileThrow[] = []

engine.addSystem((dt) => {
  if (activeThrows.length === 0) return
  for (let i = activeThrows.length - 1; i >= 0; i--) {
    const t = activeThrows[i]
    t.elapsed += dt
    const e = t.elapsed
    const position = Vector3.create(
      t.start.x + t.velocity.x * e,
      t.start.y + t.velocity.y * e + 0.5 * GRAVITY * e * e,
      t.start.z + t.velocity.z * e
    )
    void movePlayerTo({ newRelativePosition: position })
    if (e >= MAX_FLIGHT_SECONDS) activeThrows.splice(i, 1)
  }
})

/**
 * Creates a bounce trap entity.
 *
 * A bounce trap applies a strong upward-forward impulse when the player enters its trigger area.
 * Used as a floor-based launcher.
 */
export function createBounceTrap(transform: TransformTypeWithOptionals) {
  createBounceEntity(transform, {
    model: 'models/bounceTrap.glb',
    triggerTransform: { scale: Vector3.create(2.4, 0.4, 2.4), position: Vector3.create(0, 0.2, 0) },
    direction: Vector3.create(0, 24, 4),
    impulseStrength: 30
  })
}

/**
 * Creates a bounce stand entity.
 *
 * A bounce stand applies a upward-backward impulse when the player enters its trigger area.
 * Used as a directional launcher (e.g., pushing the player backward).
 */
export function createBounceStand(transform: TransformTypeWithOptionals) {
  createBounceEntity(transform, {
    model: 'models/bounceStand.glb',
    triggerTransform: { scale: Vector3.create(1.1, 2.8, 1.1), position: Vector3.create(0, 1.2, 0) },
    direction: Vector3.create(0, 4, -10),
    impulseStrength: 20
  })
}

/**
 * Factory function that creates a bounce entity with a trigger area.
 *
 * When the player enters the trigger, an impulse is applied in the specified direction.
 * This function is reused by different bounce types (trap, stand, etc).
 */
function createBounceEntity(transform: TransformTypeWithOptionals, config: BounceConfig) {
  const { model, triggerTransform, direction, impulseStrength } = config

  const entity = engine.addEntity()
  Transform.create(entity, transform)
  //MeshRenderer.setBox(entity)
  GltfContainer.create(entity, { src: model })

  const onEnter = () => {
    sendHitBounce()
    playOneShotOnPlayer('sounds/bounceTrap.mp3')
    spawnDamageBurst()

    const impulse = Transform.localToWorldDirection(engine.PlayerEntity, direction)
    Physics.applyImpulseToPlayer(impulse, impulseStrength)
  }

  createTrigger({ ...triggerTransform, parent: entity }, onEnter)
}
