/**
 * Controls which other players' avatars (and name tags) the local player sees,
 * using a scene-wide AvatarModifierArea.
 *
 * - In the runner: hide every other avatar (only the local avatar stays visible).
 * - In the lobby: show avatars again.
 *
 * NOTE: hiding other avatars is a local view effect and works for "hide everyone
 * but me". Selectively showing *only* lobby players (and hiding players who are in
 * the runner) needs to know each other player's current experience — that's shared
 * multiplayer state, which this scene's server does not publish (each player's
 * run is private to them).
 */
import { engine, Entity, Transform, AvatarModifierArea, AvatarModifierType } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/src/players'
import { SCENE_CENTER, SCENE_SIZE } from '../config'

/** Singleton modifier-area entity; created on demand, removed when not needed. */
let modifierArea: Entity | undefined

function localUserId(): string | undefined {
  try {
    return getPlayer()?.userId
  } catch (e) {
    return undefined
  }
}

/**
 * Hides every other player's avatar and name from the local player (the local
 * avatar stays visible). Used while in the runner.
 */
export function hideOtherAvatars(): void {
  if (modifierArea === undefined) {
    modifierArea = engine.addEntity()
    Transform.create(modifierArea, {
      position: Vector3.create(SCENE_CENTER, SCENE_CENTER, SCENE_CENTER)
    })
  }

  const self = localUserId()
  AvatarModifierArea.createOrReplace(modifierArea, {
    // Box large enough to cover the whole scene (and well above/below it).
    area: Vector3.create(SCENE_SIZE * 3, SCENE_SIZE * 3, SCENE_SIZE * 3),
    modifiers: [AvatarModifierType.AMT_HIDE_AVATARS],
    excludeIds: self ? [self] : []
  })
}

/** Shows all avatars again (removes the hide area). Used while in the lobby. */
export function showAllAvatars(): void {
  if (modifierArea !== undefined) {
    engine.removeEntity(modifierArea)
    modifierArea = undefined
  }
}
