import {
  engine,
  Entity,
  GltfContainer,
  Transform,
  Tween,
  TweenSequence,
  TweenLoop,
  EasingFunction,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { attachLoopingSound, playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitLaserWall } from '../../client/connection'

/** Continuous hum the player hears when approaching a laser wall. */
const LASER_SOUND = 'sounds/laserWall.mp3'

/** One-shot sound played when the player touches the wall. */
const LASER_HIT_SOUND = 'sounds/laserHit.mp3'

/** Model used for the laser wall (has its own baked flicker animation). */
const MODEL = 'models/laserWallAnimated.glb'

/** Default travel speed of a moving wall, in units per second. */
const DEFAULT_SPEED = 5

/** Trigger area covering the wall; entering it deals damage. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(5.5, 1.45, 0.25),
  position: Vector3.create(0, 1, 0)
}

/**
 * Drives an entity along a looped path using a tween sequence.
 *
 * TL_RESTART replays the initial Tween together with the sequence on every cycle,
 * so for a seamless loop the sequence must end where the initial Tween starts
 * (path[0]). One full cycle is: path[0]->path[1]->...->path[N-1]->path[0].
 *
 * Each segment's duration is derived from its length and the desired speed, so the
 * wall moves at a constant velocity across segments of different lengths.
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
 * Creates a laser wall that damages the player on contact.
 *
 * - Static wall: pass a transform with a `position` and no path.
 * - Moving wall: pass a `path` (looped waypoints, like a ball trap); the wall
 *   patrols it and its damage trigger follows along.
 *
 * Touching the trigger sends a message to the server, which reduces the player's
 * health by 5.
 *
 * @param transform Base transform (parent/rotation/scale). For a static wall the
 *   position is taken from here; for a moving wall it's taken from path[0].
 * @param path Optional looped waypoints for a moving wall (local to the parent).
 * @param speed Travel speed in units per second (constant regardless of segment length).
 */
export function createLaserWall(
  transform: TransformTypeWithOptionals,
  path?: Vector3[],
  speed: number = DEFAULT_SPEED
) {
  const isMoving = path !== undefined && path.length > 1
  const position = isMoving ? path![0] : transform.position ?? Vector3.Zero()

  const entity = engine.addEntity()
  Transform.create(entity, { ...transform, position })
  GltfContainer.create(entity, { src: MODEL })
  // Spatial loop: louder as the player nears, and it tracks a moving wall.
  attachLoopingSound(entity, LASER_SOUND)

  if (isMoving) {
    startPatrol(entity, path!, speed)
  }

  const onEnter = () => {
    // Notify the server so it applies laser-wall damage (5) to the player.
    sendHitLaserWall()
    spawnDamageBurst()
    playOneShotOnPlayer(LASER_HIT_SOUND)
  }

  createTrigger({ ...TRIGGER_TRANSFORM, parent: entity }, onEnter)
}
