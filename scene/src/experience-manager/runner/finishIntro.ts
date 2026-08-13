/**
 * Finish-preview camera movie, played when the player enters a map they haven't
 * finished yet: the camera cuts to a view of the map's finish for a couple of
 * seconds, then smoothly flies back to the player.
 *
 * The movie plays once per map visit: deaths/falls rebuild the level without
 * replaying it; leaving the runner resets the tracking so a fresh entry replays.
 */
import { engine, Entity, Transform, VirtualCamera, MainCamera, InputModifier } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

import { getCurrentLevel, getRootEntity, getUnlockedMaps } from './gameState'
import { maps } from './maps'

/** Total maps planned for the game (the unlock array has one slot per map). */
const TOTAL_MAPS = 10

/** How long (s) the camera holds on the finish before flying back. */
const HOLD_SECONDS = 2

/** How long (s) the smooth return flight to the player takes. */
const RETURN_SECONDS = 4

/** Camera framing: horizontal distance from the finish (toward the player) and
 * height above it. */
const CAM_DISTANCE = 14
const CAM_HEIGHT = 5

/** Fallback return pose (behind + above the player, looking at them), used only
 * if the real camera Transform can't be read to match exactly. */
const RETURN_BACK_DISTANCE = 6
const RETURN_BACK_HEIGHT = 2.5

/** Level the movie last played for; deaths on the same level don't replay it. */
let lastIntroLevel: number | undefined

/** Live movie state, so an experience switch mid-movie can abort cleanly. */
let active: { cam: Entity; holdTimer?: number; systemName?: string; cleanupTimer?: number } | undefined

/** Delay (s) before destroying the camera entity after handing back to the real
 * camera — removing it in the same frame glitches the handoff. */
const HANDOFF_CLEANUP_SECONDS = 0.5

/**
 * Plays the finish movie for the current level if it hasn't been finished yet
 * (next map locked, or last map) and hasn't already played this visit. Call
 * after the map has loaded and the player is placed at the spawn.
 */
export function maybePlayFinishIntro(): void {
  const level = getCurrentLevel()
  if (lastIntroLevel === level) return

  // Finished = the NEXT map is already unlocked. The last map has no next map,
  // so it always counts as unfinished and always gets the movie.
  const isLastMap = level >= TOTAL_MAPS - 1
  const finished = !isLastMap && getUnlockedMaps()[level + 1] === true
  if (finished) return

  lastIntroLevel = level
  playIntro()
}

/** Forgets which level played the movie; leaving the runner calls this so the
 * next entry shows it again (still only for unfinished maps). */
export function resetFinishIntro(): void {
  lastIntroLevel = undefined
}

/** Aborts a movie in progress (level teardown / experience switch). */
export function stopFinishIntro(): void {
  if (active === undefined) return
  if (active.holdTimer !== undefined) utils.timers.clearTimeout(active.holdTimer)
  if (active.cleanupTimer !== undefined) utils.timers.clearTimeout(active.cleanupTimer)
  if (active.systemName !== undefined) engine.removeSystem(active.systemName)
  const mainCamera = MainCamera.getMutableOrNull(engine.CameraEntity)
  if (mainCamera) mainCamera.virtualCameraEntity = undefined
  InputModifier.deleteFrom(engine.PlayerEntity)
  engine.removeEntity(active.cam)
  active = undefined
}

function playIntro(): void {
  const map = maps[getCurrentLevel()]

  // finishPosition is local to the game area, which sits (unrotated) at the
  // root entity — so world = root position + finish position.
  const rootPosition = Transform.getOrNull(getRootEntity())?.position ?? Vector3.Zero()
  const finishWorld = Vector3.add(rootPosition, map.finishPosition)

  // Put the camera between the player and the finish, looking at the finish:
  // offset from the finish toward the player, raised a little.
  const playerPosition = Transform.getOrNull(engine.PlayerEntity)?.position ?? rootPosition
  let toPlayer = Vector3.create(playerPosition.x - finishWorld.x, 0, playerPosition.z - finishWorld.z)
  if (Vector3.lengthSquared(toPlayer) < 0.01) toPlayer = Vector3.Forward()
  toPlayer = Vector3.normalize(toPlayer)

  // Start pose: the finish view, rotated to look at the finish.
  const startCamPos = Vector3.create(
    finishWorld.x + toPlayer.x * CAM_DISTANCE,
    finishWorld.y + CAM_HEIGHT,
    finishWorld.z + toPlayer.z * CAM_DISTANCE
  )
  const startCamRot = Quaternion.fromLookAt(startCamPos, finishWorld)

  // End pose: the player's ACTUAL gameplay camera. The virtual camera isn't
  // active yet, so engine.CameraEntity still holds the real third-person camera
  // — landing exactly on it makes the handoff to live gameplay seamless. Fall
  // back to a behind-the-player pose if the camera Transform isn't available.
  const realCam = Transform.getOrNull(engine.CameraEntity)
  const endCamPos = realCam
    ? Vector3.create(realCam.position.x, realCam.position.y, realCam.position.z)
    : Vector3.create(
        playerPosition.x + toPlayer.x * RETURN_BACK_DISTANCE,
        playerPosition.y + RETURN_BACK_HEIGHT,
        playerPosition.z + toPlayer.z * RETURN_BACK_DISTANCE
      )
  const endCamRot = realCam
    ? Quaternion.create(realCam.rotation.x, realCam.rotation.y, realCam.rotation.z, realCam.rotation.w)
    : Quaternion.fromLookAt(endCamPos, Vector3.create(playerPosition.x, playerPosition.y + 1.5, playerPosition.z))

  const cam = engine.addEntity()
  Transform.create(cam, { position: startCamPos, rotation: startCamRot })
  VirtualCamera.create(cam, {
    // Rotation is baked into the Transform and driven per-frame (see below), so
    // no lookAtEntity. Instant cut to the finish view on activation.
    defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0) }
  })

  // Freeze the player for the whole movie so they can't run off camera.
  InputModifier.createOrReplace(engine.PlayerEntity, {
    mode: InputModifier.Mode.Standard({ disableAll: true })
  })
  MainCamera.createOrReplace(engine.CameraEntity, { virtualCameraEntity: cam })

  const systemName = `finish-intro-return-${cam}`

  const holdTimer = utils.timers.setTimeout(() => {
    if (active) active.holdTimer = undefined

    // Fly the (still active) virtual camera from the finish view back to the
    // real gameplay camera pose over RETURN_SECONDS, then hand off + unfreeze.
    let elapsed = 0
    engine.addSystem(
      (dt: number) => {
        elapsed += dt
        const t = Math.min(elapsed / RETURN_SECONDS, 1)
        const e = t * t * (3 - 2 * t) // smoothstep ease-in-out

        const camT = Transform.getMutableOrNull(cam)
        if (camT === null) {
          engine.removeSystem(systemName)
          active = undefined
          return
        }
        camT.position = Vector3.lerp(startCamPos, endCamPos, e)
        camT.rotation = Quaternion.slerp(startCamRot, endCamRot, e)

        if (t >= 1) {
          engine.removeSystem(systemName)
          if (active) active.systemName = undefined
          // Hand back to the real camera and unfreeze immediately (instant cut).
          const mainCamera = MainCamera.getMutableOrNull(engine.CameraEntity)
          if (mainCamera) mainCamera.virtualCameraEntity = undefined
          InputModifier.deleteFrom(engine.PlayerEntity)
          // Destroy the camera entity a little later: removing it in the same
          // frame as the handoff makes the real camera read a stale virtual-cam
          // transform for a frame and snap violently to the side.
          const cleanupTimer = utils.timers.setTimeout(() => {
            engine.removeEntity(cam)
            active = undefined
          }, HANDOFF_CLEANUP_SECONDS * 1000)
          if (active) active.cleanupTimer = cleanupTimer
        }
      },
      undefined,
      systemName
    )
    if (active) active.systemName = systemName
  }, HOLD_SECONDS * 1000)

  active = { cam, holdTimer }
}
