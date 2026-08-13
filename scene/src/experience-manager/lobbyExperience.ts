/**
 * Lobby experience
 */
import {
  engine,
  Entity,
  Transform,
  GltfContainer,
  TextShape,
  TextAlignMode,
  ColliderLayer,
  pointerEventsSystem,
  InputAction,
  MeshRenderer,
  Material,
  MaterialTransparencyMode,
  VisibilityComponent
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import type { Experience } from './experienceManager'
import { switchExperience } from './experienceManager'
import { SCENE_CENTER, SCENE_SIZE } from '../config'
import { sendResetHealth, sendRequestLeaderboard } from '../client/connection'
import { createTrigger } from './runner/trigger'
import { getLastUnlockedMap, setCurrentLevel } from './runner/gameState'
import { maps } from './runner/maps'
import { showAllAvatars } from './avatarVisibility'
import { startLoadingProtection, endLoadingProtection } from './loadingProtection'

const DOME_MESH = 'models/lobby.glb'

/** Where the player lands in the lobby: just inside the dome doorway. Used on
 * lobby entry and when the fall trigger catches a player who fell off the map. */
const LOBBY_SPAWN = Vector3.create(44, SCENE_CENTER + 2.1, 52)
const LOBBY_CAMERA_TARGET = Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER)

/** World position of the speed-run leaderboard display. */
const LEADERBOARD_POSITION = Vector3.create(48, 54.8, 17.1)

/** One row of the speed-run leaderboard, as the server sends it. The map is on
 * the message envelope (see updateSpeedRunLeaderboard), not on each row. */
export type SpeedRunEntry = {
  name: string
  /** Wallet address; keys the profile-image avatar texture. */
  address?: string
  totalSeconds: number
  milliseconds: number
}

const lobbyEntities: Entity[] = []

/** Latest leaderboard data received from the server, rendered on lobby enter. */
let latestEntries: SpeedRunEntry[] = []

/** Which map's leaderboard is currently shown (1-based). */
let leaderboardMap = 1

type LeaderboardRow = {
  rankEntity: Entity
  avatarEntity: Entity
  usernameEntity: Entity
  resultEntity: Entity
}

/** Max rows shown (the server returns a top 10). */
const LEADERBOARD_LIMIT = 10

const LEADERBOARD_FONT_SIZE = 2.5
const MAX_USERNAME_LENGTH = 16

/** Local-space layout: vertical step per row and column x offsets. */
const ROW_Y_OFFSET = -0.52
const FIRST_ROW_Y = -0.68
const RANK_X_OFFSET = -2.7
const AVATAR_X_OFFSET = -2.2
const USERNAME_X_OFFSET = -1.75
const RESULT_X_OFFSET = 1.7

/** Side length of the square profile-image plane in each row. */
const AVATAR_IMAGE_SIZE = 0.42

/** Title entity + rows; rebuilt each time the lobby is entered. */
let leaderboardTitleEntity: Entity | undefined
const leaderboardRows: LeaderboardRow[] = []

function truncateName(name: string): string {
  return name.length > MAX_USERNAME_LENGTH ? name.slice(0, MAX_USERNAME_LENGTH) + '…' : name
}

function formatEntryTime(entry: SpeedRunEntry): string {
  const minutes = Math.floor(entry.totalSeconds / 60)
  const seconds = entry.totalSeconds % 60
  const millis = entry.milliseconds ?? 0
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

/**
 * Creates one board row (rank, avatar image, name, time) at local height `rowY`,
 * parented to `parent`. All created entities are registered in lobbyEntities for
 * teardown; the row is returned to the caller.
 */
function createBoardRow(rowY: number, parent: Entity): LeaderboardRow {
  const rowEntity = engine.addEntity()
  Transform.create(rowEntity, {
    position: Vector3.create(0, rowY, 0),
    parent
  })

  const rankEntity = engine.addEntity()
  Transform.create(rankEntity, { position: Vector3.create(RANK_X_OFFSET, 0, 0), parent: rowEntity })
  TextShape.create(rankEntity, {
    text: '',
    textColor: Color4.White(),
    fontSize: LEADERBOARD_FONT_SIZE,
    textWrapping: false
  })

  // Profile image: a small plane textured with the player's avatar face snapshot
  // (the renderer resolves it from the wallet address). Hidden until the row has an entry with an address.
  const avatarEntity = engine.addEntity()
  Transform.create(avatarEntity, {
    position: Vector3.create(AVATAR_X_OFFSET, 0, 0),
    scale: Vector3.create(AVATAR_IMAGE_SIZE, AVATAR_IMAGE_SIZE, 1),
    parent: rowEntity
  })
  MeshRenderer.setPlane(avatarEntity)
  VisibilityComponent.create(avatarEntity, { visible: false })

  const usernameEntity = engine.addEntity()
  Transform.create(usernameEntity, { position: Vector3.create(USERNAME_X_OFFSET, 0, 0), parent: rowEntity })
  TextShape.create(usernameEntity, {
    text: '',
    textColor: Color4.White(),
    fontSize: LEADERBOARD_FONT_SIZE,
    textWrapping: false,
    textAlign: TextAlignMode.TAM_MIDDLE_LEFT
  })

  const resultEntity = engine.addEntity()
  Transform.create(resultEntity, { position: Vector3.create(RESULT_X_OFFSET, 0, 0), parent: rowEntity })
  TextShape.create(resultEntity, {
    text: '',
    textColor: Color4.White(),
    fontSize: LEADERBOARD_FONT_SIZE,
    textWrapping: false,
    textAlign: TextAlignMode.TAM_MIDDLE_LEFT
  })

  lobbyEntities.push(rowEntity, rankEntity, avatarEntity, usernameEntity, resultEntity)
  return { rankEntity, avatarEntity, usernameEntity, resultEntity }
}

/**
 * Shows the profile image for `address` on a row's avatar plane, or hides the
 * plane when there is no address (guests, or servers not sending it yet).
 */
function applyRowAvatar(row: LeaderboardRow, address: string | undefined): void {
  if (address) {
    const avatarTexture = Material.Texture.Avatar({ userId: address })
    Material.setPbrMaterial(row.avatarEntity, {
      texture: avatarTexture,
      alphaTexture: avatarTexture,
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
      metallic: 0,
      roughness: 1,
      specularIntensity: 0,
      emissiveTexture: avatarTexture,
      emissiveColor: Color3.White(),
      emissiveIntensity: 0.8
    })
    VisibilityComponent.getMutable(row.avatarEntity).visible = true
  } else {
    VisibilityComponent.getMutable(row.avatarEntity).visible = false
  }
}

/** Updates the title and every row's texts from the latest entries. */
function renderLeaderboard(): void {
  if (leaderboardTitleEntity === undefined) return
  TextShape.getMutable(leaderboardTitleEntity).text = `MAP ${leaderboardMap}`

  leaderboardRows.forEach((row, index) => {
    const entry = latestEntries[index]
    if (entry) {
      TextShape.getMutable(row.rankEntity).text = `${index + 1}.`
      TextShape.getMutable(row.usernameEntity).text = truncateName(entry.name)
      TextShape.getMutable(row.resultEntity).text = formatEntryTime(entry)
      applyRowAvatar(row, entry.address)
    } else {
      TextShape.getMutable(row.rankEntity).text = ''
      TextShape.getMutable(row.usernameEntity).text =
        index === 0 && latestEntries.length === 0 ? '(no runs yet)' : ''
      TextShape.getMutable(row.resultEntity).text = ''
      applyRowAvatar(row, undefined)
    }
  })
}

/**
 * Cycles the displayed leaderboard map by `delta` (+1 forwards, -1 backwards),
 * wrapping around the available maps, then asks the server for that map's scores.
 */
function changeLeaderboardMap(delta: number): void {
  const count = maps.length
  leaderboardMap = ((leaderboardMap - 1 + delta + count) % count) + 1
  sendRequestLeaderboard(leaderboardMap)
  // Update the header immediately, and drop the previous map's rows so they are
  // never shown under the new title; they refresh when the server replies.
  latestEntries = []
  renderLeaderboard()
}

/**
 * Updates the leaderboard with the latest data from the server. Stores the data
 * so it can be rendered whenever the lobby (and its text entity) exists.
 */
export function updateSpeedRunLeaderboard(map: number, entries: SpeedRunEntry[]): void {
  if (map !== leaderboardMap) return
  latestEntries = entries
  renderLeaderboard()
}

const LEFT_ARROW_OFFSET = Vector3.create(0, 3, -31)
const RIGHT_ARROW_OFFSET = Vector3.create(0, 3, -31)

/** Creates a clickable model that runs `onClick` when left-clicked. */
function createLeaderboardButton(
  visualPosition: Vector3,
  model: string,
  modelOffset: Vector3,
  hoverText: string,
  onClick: () => void
): Entity {
  const button = engine.addEntity()
  Transform.create(button, { position: Vector3.subtract(visualPosition, modelOffset) })
  // Put the model's own collider on the pointer layer so it's clickable and shows
  // Decentraland's native green hover highlight (no extra box collider needed).
  GltfContainer.create(button, {
    src: model,
    invisibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
    visibleMeshesCollisionMask: ColliderLayer.CL_POINTER
  })
  pointerEventsSystem.onPointerDown(
    { entity: button, opts: { button: InputAction.IA_POINTER, hoverText } },
    onClick
  )
  return button
}

async function enterLobby(): Promise<void> {
  sendResetHealth()

  showAllAvatars()

  const dome = engine.addEntity()

  Transform.create(dome, { position: { x: SCENE_CENTER, y: SCENE_CENTER + 1, z: SCENE_CENTER } })

  GltfContainer.create(dome, { src: DOME_MESH })
  lobbyEntities.push(dome)

  startLoadingProtection(dome, LOBBY_SPAWN, () => {
    void movePlayerTo({
      newRelativePosition: LOBBY_SPAWN,
      cameraTarget: LOBBY_CAMERA_TARGET
    })
  })

  // Speed-run leaderboard display: a root with a title and LEADERBOARD_LIMIT
  // pre-built rows. Populated from the server via updateSpeedRunLeaderboard
  const leaderboardRoot = engine.addEntity()
  Transform.create(leaderboardRoot, {
    position: LEADERBOARD_POSITION,
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)
  })
  lobbyEntities.push(leaderboardRoot)

  const leaderboardTitle = engine.addEntity()
  Transform.create(leaderboardTitle, { parent: leaderboardRoot })
  TextShape.create(leaderboardTitle, {
    text: `MAP ${leaderboardMap}`,
    fontSize: 3,
    textColor: Color4.White(),
    textAlign: TextAlignMode.TAM_TOP_CENTER
  })
  leaderboardTitleEntity = leaderboardTitle
  lobbyEntities.push(leaderboardTitle)

  for (let i = 0; i < LEADERBOARD_LIMIT; i++) {
    leaderboardRows.push(createBoardRow(FIRST_ROW_Y + i * ROW_Y_OFFSET, leaderboardRoot))
  }

  // Leaderboard map switchers: backwards (left) and forwards (right), looping.
  const prevMapButton = createLeaderboardButton(
    Vector3.create(48, 52.5, 17),
    'models/leaderboardleft.glb',
    LEFT_ARROW_OFFSET,
    'Previous map',
    () => changeLeaderboardMap(-1)
  )
  const nextMapButton = createLeaderboardButton(
    Vector3.create(48, 52.5, 17),
    'models/leaderboardright.glb',
    RIGHT_ARROW_OFFSET,
    'Next map',
    () => changeLeaderboardMap(1)
  )
  lobbyEntities.push(prevMapButton, nextMapButton)

  // Show map 1's leaderboard on entry, and ask the server to (re)load it.
  leaderboardMap = 1
  renderLeaderboard()
  sendRequestLeaderboard(leaderboardMap)

  // Trigger at (0, 3, 0): running into it enters the runner at the player's last unlocked map.
  const runnerTrigger = createTrigger(
    { position: Vector3.create(48, 52, 48), scale: Vector3.create(3, 3, 0.25) },
    () => {
      setCurrentLevel(getLastUnlockedMap())
      switchExperience('runner').catch((err) => console.log('switchExperience failed', err))
    }
  )
  lobbyEntities.push(runnerTrigger)

  // Fall safety net, mirroring the runner's createFallTrigger: a scene-wide
  // volume well below the lobby floor (~y 50) that catches a player who fell off
  // the map and drops them back at the lobby spawn. No message, repeatable.
  const fallHeight = 25
  const fallTrigger = createTrigger(
    {
      position: Vector3.create(SCENE_CENTER, (SCENE_CENTER - fallHeight) / 2, SCENE_CENTER),
      scale: Vector3.create(SCENE_SIZE, SCENE_CENTER - fallHeight, SCENE_SIZE)
    },
    () => {
      void movePlayerTo({
        newRelativePosition: LOBBY_SPAWN,
        cameraTarget: LOBBY_CAMERA_TARGET
      })
    }
  )
  lobbyEntities.push(fallTrigger)

  try {
    await movePlayerTo({
      newRelativePosition: LOBBY_SPAWN,
      cameraTarget: LOBBY_CAMERA_TARGET,
    })
    console.log("scene center ", )
    console.log('movePlayerTo ok', SCENE_CENTER)
    console.log('movePlayerTo ok', SCENE_CENTER+2)

  } catch (err) {
    console.log('movePlayerTo failed', err)
  }
}

function exitLobby(): void {
  // Stop any in-flight dome-loading protection (e.g. leaving the lobby mid-load).
  endLoadingProtection()

  for (const e of lobbyEntities) {
    try { engine.removeEntity(e) } catch (_err) { /* ignore */ }
  }
  lobbyEntities.length = 0
  leaderboardTitleEntity = undefined
  leaderboardRows.length = 0
}

export const lobbyExperience: Experience = {
  enter: enterLobby,
  exit: exitLobby,
}
