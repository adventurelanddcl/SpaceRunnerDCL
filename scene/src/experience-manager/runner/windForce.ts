import { engine, Entity, GltfContainer, Physics, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'

/** Model used for the wind column. */
const MODEL = 'models/windForce.glb'

/** Continuous force magnitude while the player is in the column. Must beat gravity
 * to lift; tune for how fast the player rises/drifts. */
const WIND_STRENGTH = 30

/** Base push direction in the entity's local space: straight up. The map-defined
 * rotation turns it — unrotated pushes up, 90 on X/Z pushes sideways. */
const BASE_DIRECTION = Vector3.create(0, 1, 0)

/** Horizontal footprint of the trigger volume (matches the ~3.6-wide model). */
const TRIGGER_WIDTH = 3.6

/** Trigger height (along the column axis) when a map doesn't specify one. The
 * force acts for the whole height, so a taller trigger = a longer/higher ride. */
const DEFAULT_TRIGGER_HEIGHT = 10

/**
 * Wind sources with an active continuous force, keyed by the wind entity. Cleared
 * by clearWindForces() on level teardown so a force can't leak onto the player if
 * the level is rebuilt while they're inside a column (the exit trigger would be
 * gone before it fires).
 */
const activeWinds = new Set<Entity>()

/**
 * Creates a wind-force column: while the player stands in its trigger volume a
 * continuous force pushes them along the column's orientation.
 *
 * The push follows the map-defined `rotation`: unrotated pushes straight up; a 90°
 * rotation on X or Z tips the column sideways so it pushes horizontally, etc. The
 * model and trigger rotate together, so the force always matches the visual.
 *
 * @param transform Base transform (position/parent/rotation/scale).
 * @param triggerHeight How tall the wind-affect volume is along the column axis
 *   (default `DEFAULT_TRIGGER_HEIGHT`). Taller = the player is pushed for longer,
 *   so they travel higher/further — set per map for varied ride heights.
 */
export function createWindForce(transform: TransformTypeWithOptionals, triggerHeight?: number) {
  const wind = engine.addEntity()
  Transform.create(wind, { ...transform })
  GltfContainer.create(wind, { src: MODEL })

  // Force direction: local up turned by the map-defined rotation. Fixed, so
  // compute once. applyForceToPlayer normalizes it before scaling.
  const direction = Vector3.rotate(BASE_DIRECTION, transform.rotation ?? Quaternion.Identity())

  // Trigger spans from the column base (local y 0) up to `triggerHeight`, so it
  // rotates with the entity and its height sets how far the player is carried.
  const height = triggerHeight ?? DEFAULT_TRIGGER_HEIGHT
  const triggerTransform: TransformTypeWithOptionals = {
    scale: Vector3.create(TRIGGER_WIDTH, height, TRIGGER_WIDTH),
    position: Vector3.create(0, height / 2, 0)
  }

  // Continuous force is registered once on enter and removed on exit — no
  // per-frame system. Keyed by `wind`, so overlapping columns stack independently.
  createTrigger({ ...triggerTransform, parent: wind }, () => {
    Physics.applyForceToPlayer(wind, direction, WIND_STRENGTH)
    activeWinds.add(wind)
  })

  createTrigger({ ...triggerTransform, parent: wind }, () => {
    Physics.removeForceFromPlayer(wind)
    activeWinds.delete(wind)
  }, false, 'exit')
}

/**
 * Removes every active wind force from the player. Call on level teardown: if the
 * player leaves while inside a column, the exit trigger is destroyed with the level
 * before it can fire, so the force would otherwise persist into the next level.
 */
export function clearWindForces(): void {
  for (const wind of activeWinds) {
    Physics.removeForceFromPlayer(wind)
  }
  activeWinds.clear()
}
