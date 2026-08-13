import { engine, Entity, Animator, GltfContainer, MeshCollider, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'

/** Pointer-arrow guide shown above the first platform (optional, per map). */
const ARROW_MODEL = 'models/pointerArrow.glb'
const ARROW_CLIP = 'PlaneAction'
/** How far above the first platform the arrow floats (local units). */
const ARROW_Y_OFFSET = 0.25

/**
 * Default maximum height (Y) the ascending platforms climb to. Once the next
 * platform would rise above this, the tower is complete and no more platforms
 * spawn. Overridable per map via `createSpawningPlatformUP`'s `maxBlockHeight`.
 */
const DEFAULT_MAX_BLOCK_HEIGHT = 36

/** Model used for each spawning platform. */
const MODEL = 'models/spawningPlatform.glb'

/** Visual + collider size of each platform. */
const PLATFORM_SCALE = Vector3.create(1, 1, 1)

/** Trigger that detects the player standing on a platform (placed above it). */
const TRIGGER_SCALE = Vector3.create(2.5, 1, 2.5)
const TRIGGER_Y_OFFSET = 0.5

/** Y increase per platform: climb one step up. */
const STEP_UP = 2

/** Default max horizontal distance (X/Z) a new platform can be from the previous
 * one. Overridable per map via `createSpawningPlatformUP`'s `maxDistance`. */
const DEFAULT_MAX_DISTANCE = 6

/** Minimum horizontal gap a new platform must keep from the previous two. */
const MIN_GAP = 2

/** Default half-extent of the horizontal play area (around the start) platforms
 * stay within. Overridable per map via `createSpawningPlatformUP`'s `boundary`. */
const DEFAULT_BOUNDARY = 15

/** Safety cap on placement retries so the do/while loops can't spin forever. */
const MAX_PLACEMENT_ATTEMPTS = 40

/** One tower's configuration in a map definition: a base transform plus the
 * optional per-tower knobs. Maps list an array of these so several towers can be
 * placed in one map. */
export type SpawningPlatformUPConfig = TransformTypeWithOptionals & {
  showPointerArrow?: boolean
  maxBlockHeight?: number
  maxDistance?: number
  boundary?: number
}


/**
 * Creates an ascending tower of platforms.
 *
 * The first platform appears at the given position. Each time the player steps on
 * a platform, the next one spawns one step up and one step over in a random
 * horizontal direction. This repeats until the next
 * platform would exceed `maxBlockHeight`. If the player falls off the tower,
 * `onFail` is invoked (used to reset the map).
 *
 * @param showPointerArrow When true, the caller may later float an animated guide
 *   arrow above the first platform via the returned `revealPointerArrow()` (used to
 *   show it only once all gems are collected). The arrow disappears once the player
 *   steps on that platform. When false, `revealPointerArrow()` is a no-op.
 * @param maxBlockHeight Height (Y) the tower climbs to before it stops spawning
 *   platforms. Defaults to DEFAULT_MAX_BLOCK_HEIGHT.
 * @param maxDistance Max horizontal distance (X/Z) each new platform can be from
 *   the previous one. Defaults to DEFAULT_MAX_DISTANCE.
 * @param boundary Half-extent of the horizontal play area (around the start) the
 *   platforms stay within. Defaults to DEFAULT_BOUNDARY.
 * @returns A handle whose `revealPointerArrow()` shows the guide arrow.
 */
export function createSpawningPlatformUP(
  transform: TransformTypeWithOptionals,
  onFail: () => void,
  showPointerArrow: boolean = false,
  maxBlockHeight: number = DEFAULT_MAX_BLOCK_HEIGHT,
  maxDistance: number = DEFAULT_MAX_DISTANCE,
  boundary: number = DEFAULT_BOUNDARY
): { revealPointerArrow: () => void } {
  const parent = transform.parent
  const start = transform.position ?? Vector3.Zero()

  // Positions of every platform spawned so far, in order.
  const blocks: Vector3[] = []
  let currentHeight = start.y

  let highestY = -Infinity
  let climbing = false
  let completed = false
  let failed = false

  // Pointer-arrow guide above the first platform. Shown on demand (once all gems
  // are collected) and removed once the first platform is stepped on.
  let pointerArrow: Entity | undefined
  let firstStepped = false
  const removePointerArrow = () => {
    if (pointerArrow !== undefined) {
      engine.removeEntity(pointerArrow)
      pointerArrow = undefined
    }
  }

  const revealPointerArrow = () => {
    // Only for maps that requested it, and only while the arrow makes sense:
    // not once, and not after the player already started climbing.
    if (!showPointerArrow || pointerArrow !== undefined || firstStepped) return
    pointerArrow = engine.addEntity()
    Transform.create(pointerArrow, {
      position: Vector3.create(start.x, start.y + ARROW_Y_OFFSET, start.z),
      parent
    })
    GltfContainer.create(pointerArrow, { src: ARROW_MODEL })
    Animator.create(pointerArrow, { states: [{ clip: ARROW_CLIP, playing: true, loop: true }] })
  }

  /** Clamp a coordinate to the horizontal play area around the start. */
  function applyBoundaries(value: number, center: number): number {
    return Math.max(center - boundary, Math.min(center + boundary, value))
  }

  /**
   * one step up in Y, and X/Z within ±MAX_DISTANCE of the
   * previous platform while staying at least MIN_GAP away from the previous two
   * (so platforms don't stack on top of each other).
   */
  function nextPosition(): Vector3 {
    const previousBlock = blocks[blocks.length - 1]
    const previousBlock2 = blocks[blocks.length - 2] // may be undefined

    // y is one step higher.
    currentHeight += STEP_UP
    const y = currentHeight

    let x = previousBlock.x
    let attempts = 0
    do {
      x = applyBoundaries(previousBlock.x - maxDistance + Math.random() * (maxDistance * 2), start.x)
    } while (
      ++attempts < MAX_PLACEMENT_ATTEMPTS &&
      (Math.abs(x - previousBlock.x) < MIN_GAP ||
        (previousBlock2 !== undefined && Math.abs(x - previousBlock2.x) < MIN_GAP))
    )

    let z = previousBlock.z
    attempts = 0
    do {
      z = applyBoundaries(previousBlock.z - maxDistance + Math.random() * (maxDistance * 2), start.z)
    } while (
      ++attempts < MAX_PLACEMENT_ATTEMPTS &&
      (Math.abs(z - previousBlock.z) < MIN_GAP ||
        (previousBlock2 !== undefined && Math.abs(z - previousBlock2.z) < MIN_GAP))
    )

    return Vector3.create(x, y, z)
  }

  function spawnPlatform(position: Vector3): Entity {
    const isFirst = blocks.length === 0
    blocks.push(position)

    const platform = engine.addEntity()
    Transform.create(platform, { position, scale: PLATFORM_SCALE, parent })
    GltfContainer.create(platform, { src: MODEL })
    MeshCollider.setBox(platform) // standable surface

    let spawnedNext = false
    const onStep = () => {
      // Stepping on the first platform dismisses the pointer-arrow guide (and
      // stops it re-appearing if all gems are collected afterward).
      if (isFirst) {
        firstStepped = true
        removePointerArrow()
      }

      climbing = true
      if (position.y > highestY) highestY = position.y

      if (spawnedNext || completed) return
      spawnedNext = true

      // Stop once the next platform would rise above the max height.
      if (currentHeight + STEP_UP > maxBlockHeight) {
        completed = true
        return
      }
      spawnPlatform(nextPosition())
    }

    // Trigger sits above the platform. It's parented to the game area (not the
    // platform) so its size isn't multiplied by the platform's scale.
    createTrigger(
      {
        parent,
        position: Vector3.create(position.x, position.y + TRIGGER_Y_OFFSET, position.z),
        scale: TRIGGER_SCALE
      },
      onStep
    )

    return platform
  }

  const firstPlatform = spawnPlatform(Vector3.create(start.x, start.y, start.z))

  // The guide arrow isn't shown at build time — the caller reveals it once all
  // gems are collected. It's parented to the game area, so the level teardown
  // removes it with everything else.
  return { revealPointerArrow }
}

/**
 * Creates several ascending towers in one call (a map can define more than one).
 * Each config's per-tower knobs are unpacked and forwarded to createSpawningPlatformUP,
 * with `parent` and the shared `onFail` applied to all.
 *
 * @returns One handle per tower, so the caller can reveal every tower's guide arrow
 *   (those that requested one) when all gems are collected.
 */
export function createSpawningPlatformUPs(
  configs: SpawningPlatformUPConfig[],
  parent: Entity,
  onFail: () => void
): { revealPointerArrow: () => void }[] {
  return configs.map(({ showPointerArrow, maxBlockHeight, maxDistance, boundary, ...transform }) =>
    createSpawningPlatformUP(
      { ...transform, parent },
      onFail,
      showPointerArrow,
      maxBlockHeight,
      maxDistance,
      boundary
    )
  )
}
