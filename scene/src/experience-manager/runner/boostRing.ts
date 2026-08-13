import {
  engine,
  GltfContainer,
  Physics,
  Transform,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'

/** Model used for the boost ring. */
const MODEL = 'models/boostRing.glb'

/** One-shot sound played when the player is launched by the ring. */
const BOOST_SOUND = 'sounds/boostRing.mp3'

/** Upward launch strength. applyImpulseToPlayer normalizes the direction before
 * scaling, so this is effectively the magnitude of the straight-up impulse. */
const BOOST_STRENGTH = 25

/** Trigger area covering the ring's interior; stepping into it launches the player. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(2.5, 2.5, 0.4),
  position: Vector3.create(0, -0.25, 0)
}

/**
 * Creates a boost ring: when the player steps into it, they are thrown along the
 * ring's up axis.
 *
 * The launch direction follows the map-defined `rotation`: an unrotated ring throws
 * straight up, a tilted ring (e.g. `Quaternion.fromEulerDegrees(30, 0, 0)`) throws
 * up-and-forward along its tilt. The trigger is parented, so it tilts along too.
 *
 * @param transform Base transform (position/parent/rotation/scale).
 */
export function createBoostRing(transform: TransformTypeWithOptionals) {
  const entity = engine.addEntity()
  Transform.create(entity, { ...transform })
  GltfContainer.create(entity, { src: MODEL })

  // The ring's up axis: world-up turned by the map-defined rotation (if any).
  const boostDirection = Vector3.rotate(Vector3.Up(), transform.rotation ?? Quaternion.Identity())

  const onEnter = () => {
    // applyImpulseToPlayer normalizes the direction before scaling, so this is a
    // pure BOOST_STRENGTH impulse along the ring's axis.
    Physics.applyImpulseToPlayer(boostDirection, BOOST_STRENGTH)
    playOneShotOnPlayer(BOOST_SOUND)
  }

  createTrigger({ ...TRIGGER_TRANSFORM, parent: entity }, onEnter)
}

/**
 * Randomly picks which boost rings to spawn from groups of candidates.
 *
 * Each group's candidates are bucketed by their y coordinate, and one candidate is
 * picked at random per y level — so every level gets exactly one ring from every
 * group that defines candidates there (a level missing from a group simply gets no
 * ring from that group, e.g. map5's Rings 3 has nothing at y 30).
 *
 * Runs on every map build, so each entry/reset deals a fresh layout.
 */
export function pickBoostRings(groups: TransformTypeWithOptionals[][]): TransformTypeWithOptionals[] {
  const picked: TransformTypeWithOptionals[] = []
  for (const group of groups) {
    const byLevel = new Map<number, TransformTypeWithOptionals[]>()
    for (const ring of group) {
      const y = ring.position?.y ?? 0
      const bucket = byLevel.get(y)
      if (bucket) bucket.push(ring)
      else byLevel.set(y, [ring])
    }
    for (const candidates of byLevel.values()) {
      picked.push(candidates[Math.floor(Math.random() * candidates.length)])
    }
  }
  return picked
}
