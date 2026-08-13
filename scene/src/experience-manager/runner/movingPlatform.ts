import {
  engine,
  Entity,
  GltfContainer,
  Transform,
  Tween,
  EasingFunction,
  CameraModeArea,
  CameraType,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

import { createTrigger } from './trigger'
import { isMobile } from '../../platform'

/** Model used for the moving platform. */
const MODEL = 'models/movingplatform.glb'

/** Default travel speed, in units per second (used to size each segment's tween). */
const DEFAULT_SPEED = 7

/** Trigger area that starts the platform when the player steps on it. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(6.4, 2, 6.4),
  position: Vector3.create(0, 1, 0)
}


const CAMERA_AREA_SIZE = Vector3.create(6.4, 4, 6.4)
const CAMERA_AREA_OFFSET = Vector3.create(0, 2, 0)

/**
 * Creates a platform that stays stationary until the player steps on it, then
 * travels once through `introPath` and loops `loopPath` forever, all at a
 * constant speed regardless of how far apart the waypoints are.
 *
 * Movement is split by platform: desktop uses an SDK `Tween` (smooth, renderer
 * interpolated, and the desktop explorer carries a standing player on it), while
 * mobile drives the Transform per-frame instead. A Tween only moves the entity in
 * the renderer — the scene-side Transform never changes — and the mobile explorer
 * won't carry a player on such a renderer-only mover, so the platform slides out
 * from under them. Moving the Transform each frame makes the collider a genuinely
 * moving physics body, which is what mobile needs to carry the player.
 *
 * @param transform Base transform (parent/rotation/scale).
 * @param introPath One-time lead-in waypoints (local to the parent). The platform
 *   starts stationary at introPath[0].
 * @param loopPath Waypoints looped indefinitely after the intro; loopPath[0] is the
 *   first point the platform travels to once the intro is done.
 * @param speed Travel speed in units per second.
 */
export function createMovingPlatform(
  transform: TransformTypeWithOptionals,
  introPath: Vector3[],
  loopPath: Vector3[],
  speed: number = DEFAULT_SPEED
) {
  // Stationary starting position: the first intro waypoint.
  const startPosition = introPath[0] ?? transform.position ?? Vector3.Zero()

  const platform = engine.addEntity()
  Transform.create(platform, { ...transform, position: startPosition })
  GltfContainer.create(platform, { src: MODEL })

  let started = false
  const onEnter = () => {
    if (started) return
    started = true
      startJourneyTween(platform, startPosition, introPath, loopPath, speed)
  }

  createTrigger({ ...TRIGGER_TRANSFORM, parent: platform }, onEnter, true)

}

/** Ordered targets for one journey: the rest of the intro path, then the loop path. */
function buildTargets(introPath: Vector3[], loopPath: Vector3[]): Vector3[] {
  return [...introPath.slice(1), ...loopPath]
}

/**
 * Desktop: walks the platform through its waypoints with one tween per segment.
 *
 * After the final waypoint we wrap back to the start of the loop path, so the intro
 * is travelled once and loopPath repeats forever — loopPath[0] is the first point
 * reached once the intro finishes. Each segment's duration is derived from its
 * length and the desired speed, so the platform moves at a constant velocity.
 */
function startJourneyTween(
  platform: Entity,
  startPosition: Vector3,
  introPath: Vector3[],
  loopPath: Vector3[],
  speed: number
) {
  const targets = buildTargets(introPath, loopPath)
  if (targets.length === 0) return

  const loopStartIndex = introPath.length - 1 // index of loopPath[0] within targets

  let from = startPosition
  let index = 0

  const moveNext = () => {
    if (Transform.getOrNull(platform) === null) return // platform was torn down

    const to = targets[index]
    const duration = segmentDuration(from, to, speed)
    Tween.createOrReplace(platform, {
      mode: Tween.Mode.Move({ start: from, end: to }),
      duration,
      easingFunction: EasingFunction.EF_LINEAR
    })

    from = to
    index = index + 1 >= targets.length ? loopStartIndex : index + 1
    utils.timers.setTimeout(moveNext, duration)
  }

  moveNext()
}

/**
 * Mobile: drives the platform along the same waypoints with a per-frame system,
 * updating the Transform directly so the collider is a real moving physics body the
 * mobile explorer carries the player on. The elapsed-time carry-over keeps the speed
 * exact across segment boundaries and frame spikes.
 */
function startJourneySystem(
  platform: Entity,
  startPosition: Vector3,
  introPath: Vector3[],
  loopPath: Vector3[],
  speed: number
) {
  const targets = buildTargets(introPath, loopPath)
  if (targets.length === 0) return

  const loopStartIndex = introPath.length - 1 // index of loopPath[0] within targets

  let from = startPosition
  let index = 0
  let to = targets[index]
  let duration = segmentDuration(from, to, speed)
  let elapsed = 0

  const systemName = `platform-move-${platform}`
  engine.addSystem(
    (dt) => {
      const t = Transform.getMutableOrNull(platform)
      if (t === null) {
        engine.removeSystem(systemName) // platform was torn down (level switch)
        return
      }

      elapsed += dt * 1000

      // Advance past any completed segments (handles tiny segments / frame spikes),
      // carrying the leftover time so the constant speed isn't disturbed.
      while (elapsed >= duration) {
        elapsed -= duration
        from = to
        index = index + 1 >= targets.length ? loopStartIndex : index + 1
        to = targets[index]
        duration = segmentDuration(from, to, speed)
      }

      t.position = Vector3.lerp(from, to, duration > 0 ? elapsed / duration : 1)
    },
    undefined,
    systemName
  )
}

/** Milliseconds to travel from `a` to `b` at `speed` units/second. */
function segmentDuration(a: Vector3, b: Vector3, speed: number): number {
  const distance = Vector3.distance(a, b)
  return Math.max(1, (distance / speed) * 1000)
}
