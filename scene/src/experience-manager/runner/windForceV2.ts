import { engine, GltfContainer, Physics, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'

/** Model used for the wind column (shared with the continuous windForce). */
const MODEL = 'models/windForce.glb'

/** One-shot sound played when the column launches the player. */
const BOOST_SOUND = 'sounds/boostRing.mp3'

/** Launch strength when a map doesn't specify one. applyImpulseToPlayer
 * normalizes the direction before scaling, so this is the impulse magnitude. */
const DEFAULT_STRENGTH = 25

/** Base launch direction in the entity's local space: straight up. The map-defined
 * rotation turns it — unrotated throws up, a tilt throws up-and-over. */
const BASE_DIRECTION = Vector3.create(0, 1, 0)

/** Trigger volume at the column base: the model's ~3.6-wide footprint, tall
 * enough to catch a player walking or falling in. */
const TRIGGER_WIDTH = 3.6
const TRIGGER_HEIGHT = 2

/**
 * Creates a wind-force launcher: stepping into the column throws the player along
 * its orientation in a single burst.
 *
 * This is the boost-ring behaviour on the wind column — one impulse on contact
 * rather than the continuous force of `windForce.ts`. Because it is a one-shot,
 * there is no force to unregister, so it needs none of the teardown bookkeeping
 * the continuous version does (`clearWindForces`).
 *
 * The launch follows the map-defined `rotation`: unrotated throws straight up, a
 * tilted column throws up-and-forward along its tilt. The trigger is parented to
 * the column, so it tilts along with it.
 *
 * @param transform Base transform (position/parent/rotation/scale).
 * @param strength Impulse magnitude (default `DEFAULT_STRENGTH`) — set per column
 *   in the map definition for weaker hops or bigger launches.
 */
export function createWindForceV2(
  transform: TransformTypeWithOptionals,
  strength: number = DEFAULT_STRENGTH
) {
  const wind = engine.addEntity()
  Transform.create(wind, { ...transform })
  GltfContainer.create(wind, { src: MODEL })

  // Launch direction: local up turned by the map-defined rotation (if any).
  const launchDirection = Vector3.rotate(BASE_DIRECTION, transform.rotation ?? Quaternion.Identity())

  const triggerTransform: TransformTypeWithOptionals = {
    scale: Vector3.create(TRIGGER_WIDTH, TRIGGER_HEIGHT, TRIGGER_WIDTH),
    position: Vector3.create(0, TRIGGER_HEIGHT / 2, 0)
  }

  createTrigger({ ...triggerTransform, parent: wind }, () => {
    Physics.applyImpulseToPlayer(launchDirection, strength)
    playOneShotOnPlayer(BOOST_SOUND)
  })
}
