/**
 * GLB-loading fall protection
 */
import {
  engine,
  Entity,
  GltfContainerLoadingState,
  InputModifier,
  LoadingState,
  MeshCollider,
  ColliderLayer,
  Transform
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

/** Give up waiting after this long (s) so a broken GLB can't freeze the player forever. */
const LOADING_TIMEOUT = 20

/** Size of the invisible floor placed under the spawn point. */
const FLOOR_SIZE = Vector3.create(10, 0.5, 10)

let watchedModel: Entity | undefined
let elapsed = 0
let floor: Entity | undefined
let onDone: (() => void) | undefined

/**
 * Starts protecting the player while `model` loads: invisible floor 1m below
 * `spawnPosition` + movement freeze. `done` runs once the model is ready.
 */
export function startLoadingProtection(model: Entity, spawnPosition: Vector3, done?: () => void): void {
  endLoadingProtection() // replace any protection still in flight

  watchedModel = model
  elapsed = 0
  onDone = done

  floor = engine.addEntity()
  Transform.create(floor, {
    position: Vector3.create(spawnPosition.x, spawnPosition.y - 1, spawnPosition.z),
    scale: Vector3.create(FLOOR_SIZE.x, FLOOR_SIZE.y, FLOOR_SIZE.z)
  })
  // Collider only — nothing to render, so the floor is invisible.
  MeshCollider.setBox(floor, ColliderLayer.CL_PHYSICS)

  InputModifier.createOrReplace(engine.PlayerEntity, {
    mode: InputModifier.Mode.Standard({ disableAll: true })
  })
}

/** Removes the floor and restores movement. Safe to call repeatedly. */
export function endLoadingProtection(): void {
  watchedModel = undefined
  onDone = undefined
  if (floor !== undefined) {
    engine.removeEntity(floor)
    floor = undefined
  }
  InputModifier.deleteFrom(engine.PlayerEntity)
}

/** Whether a protection is currently active (used by fall triggers to rescue
 * loading-time falls silently instead of failing the run). */
export function isLoadingProtectionActive(): boolean {
  return watchedModel !== undefined
}

engine.addSystem((dt) => {
  if (watchedModel === undefined) return

  // Watched model was torn down (experience switch mid-load): stop and clear.
  if (Transform.getOrNull(watchedModel) === null) {
    endLoadingProtection()
    return
  }

  elapsed += dt
  const state = GltfContainerLoadingState.getOrNull(watchedModel)?.currentState
  const done =
    state === LoadingState.FINISHED ||
    state === LoadingState.FINISHED_WITH_ERROR ||
    state === LoadingState.NOT_FOUND ||
    elapsed >= LOADING_TIMEOUT

  if (!done) return

  const callback = onDone
  endLoadingProtection()
  callback?.()
})
