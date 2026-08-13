import { movePlayerTo, MovePlayerToRequest } from '~system/RestrictedActions'

import { engine, Entity, GltfContainer, removeEntityWithChildren, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createBounceStand, createBounceTrap } from './bounce'
import { createBounceV2 } from './bounceV2'
import { SCENE_CENTER, SCENE_SIZE } from '../../config'
import { finishTimer, getCurrentLevel, getRootEntity, resetTimer, startTimer } from './gameState'
import { createGem, Gem } from './gem'
import { addGemToInventory, getGemCountByType, resetInventory } from './inventory'
import { maps } from './maps'
import { createTrigger } from './trigger'
import { createBallTrap } from './trap'
import { createLaserWall } from './laserWall'
import { createLaserMazeWall } from './laserMazeWall'
import { createLaserMazeVertical } from './laserMazeVertical'
import { createSwingBeam } from './swingBeam'
import { createSpikeBeam } from './spikeBeam'
import { createSpikePlate } from './spikePlate'
import { createSpawningPlatformUPs } from './spawningPlatformUP'
import { createMovingPlatform } from './movingPlatform'
import { createFloatingPlatform } from './floatingPlatform'
import { createBoostRing, pickBoostRings } from './boostRing'
import { createGliderMine } from './gliderMine'
import { createWindForce, clearWindForces } from './windForce'
import { createWindForceV2 } from './windForceV2'
import { createWindForceV3 } from './windForceV3'
import { createMeteor } from './meteor'
import { createEnemy } from './enemy'
import { createMaze } from './maze'
import { createSpawningPlatformPath } from './spawningPlatformPath'
import { createCollapsingPlatform } from './collapsingPlatform'
import { sendFailedRun, sendFinishRun, sendRequestGems, sendResetHealth, sendStartRun } from '../../client/connection'
import { showFallMessage, showMissingGemsMessage } from '../../ui/centerMessage'
import {
  startLoadingProtection,
  endLoadingProtection,
  isLoadingProtectionActive
} from '../loadingProtection'
import { maybePlayFinishIntro, stopFinishIntro, resetFinishIntro } from './finishIntro'

/**
 * Player spawn request for the current map. Spawn position and the camera/avatar
 * look targets are all defined per map (maps/*.ts); the scene centre is only a
 * fallback for maps that don't specify targets.
 */
export function getSpawnRequest(): MovePlayerToRequest {
  const map = maps[getCurrentLevel()]
  const defaultTarget = Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER)
  return {
    newRelativePosition: map.spawnPosition,
    cameraTarget: map.spawnCameraTarget ?? defaultTarget,
    avatarTarget: map.spawnAvatarTarget ?? defaultTarget
  }
}

/**
 * Reference to the current level container entity.
 * Used for cleanup when switching levels.
 */
let gameArea: Entity | undefined

/** A gem chosen by the server for the current run. */
export type SpawnedGem = { position: Vector3; gemType: Gem }

/**
 * Monotonic id for the latest gem request. The server echoes it back, so a reply
 * from a previous level/area (a stale request) can be ignored.
 */
let gemRequestId = 0

/** Gems the server selected for the current run, used by the inventory UI. */
let currentGems: SpawnedGem[] = []

/** Handle to the current map's spawning-platform tower (if any), used to reveal
 * its guide arrow once all gems are collected. */
let spawningPlatformUpHandles: { revealPointerArrow: () => void }[] = []


/**
 * Creates a game area for the current level (map) including:
 * - Environment model
 * - Obstacles (bounce traps & stands)
 * - Collectibles (gems)
 * - Gameplay triggers (start, finish, fall)
 */
export function createGameArea(): Entity | undefined {
  const currentLevel = getCurrentLevel()
  const parent = getRootEntity()

  // Prevent out-of-bounds level access
  if (currentLevel + 1 > maps.length) return

  // Cleanup previous level before creating a new one
  cleanup()

  const {
    modelPath,
    modelPosition,
    fallTriggerPosition,
    startPosition,
    startSize,
    finishPosition,
    finishSize,
    ballTraps,
    laserWalls,
    laserMazeWalls,
    laserMazeVerticals,
    swingBeams,
    spikeBeams,
    spikePlates,
    bounceTraps,
    bounceStands,
    bounceV2s,
    spawningPlatformUPs,
    collapsingPlatforms,
    movingPlatforms,
    floatingPlatforms,
    spawningPlatformPaths,
    boostRings,
    boostRingGroups,
    gliderMines,
    windForces,
    windForceV2s,
    windForceV3s,
    meteors,
    enemies,
    maze
  } = maps[currentLevel]

  gameArea = engine.addEntity()
  Transform.create(gameArea, { parent })

  // The map model lives on its own child so its map-defined position can offset
  // it without moving everything else parented to the game area root.
  const mapModel = engine.addEntity()
  Transform.create(mapModel, { parent: gameArea, position: modelPosition ?? Vector3.Zero() })
  GltfContainer.create(mapModel, { src: modelPath })

  // Until the map GLB (with its colliders) has actually loaded, the player
  // stands frozen on an invisible safety floor (see loadingProtection.ts); once
  // the renderer reports the model ready they're placed cleanly at the spawn.
  startLoadingProtection(mapModel, maps[currentLevel].spawnPosition, () => {
    movePlayerTo(getSpawnRequest())
    // Once the map is visible and the player is placed: show the finish-preview
    // camera movie (only for maps not finished yet, once per visit).
    maybePlayFinishIntro()
  })

  ballTraps?.forEach(({ transform, path, speed }) => {
    createBallTrap({ ...transform, parent: gameArea }, path, speed)
  })

  laserWalls?.forEach(({ position, path, speed, rotation }) => {
    createLaserWall({ position, rotation, parent: gameArea }, path, speed)
  })

  // Laser mazes: a wall of diagonal beams scrolling in opposite directions.
  // Only pass `rotation` when defined — an explicit `rotation: undefined` would
  // overwrite Transform's default identity and crash the serializer at flush.
  laserMazeWalls?.forEach(({ position, length, rotation }) => {
    createLaserMazeWall({ position, parent: gameArea, ...(rotation ? { rotation } : {}) }, length)
  })

  // Vertical laser mazes: a row of vertical beams sweeping a path back and forth.
  laserMazeVerticals?.forEach(({ path, height, speed, rotation }) => {
    createLaserMazeVertical({ parent: gameArea, ...(rotation ? { rotation } : {}) }, path, height, speed)
  })

  swingBeams?.forEach((transform) => {
    createSwingBeam({ ...transform, parent: gameArea })
  })

  // Spinning spiked bars that patrol a path and throw the player on contact.
  spikeBeams?.forEach(({ path, rotation, speed }) => {
    createSpikeBeam({ parent: gameArea, ...(rotation ? { rotation } : {}) }, path, speed)
  })

  // Patrolling plates whose spikes stab out on a timer; only dangerous while up.
  spikePlates?.forEach(({ path, speed, safeTime }) => {
    createSpikePlate({ parent: gameArea }, path, speed, safeTime)
  })

  bounceTraps?.forEach((transform) => {
    createBounceTrap({ ...transform, parent: gameArea })
  })

  bounceStands?.forEach((transform) => {
    createBounceStand({ ...transform, parent: gameArea })
  })

  // Rotation-aimed bounces: throw along the entity's own orientation.
  bounceV2s?.forEach((transform) => {
    createBounceV2({ ...transform, parent: gameArea })
  })

  // Ascending wind-force platform tower. Falling off it resets the level. Its
  // guide arrow is revealed only once all gems are collected (see applyServerGems).
  if (spawningPlatformUPs) {
    spawningPlatformUpHandles = createSpawningPlatformUPs(spawningPlatformUPs, gameArea, resetGameMap)
  }

  // Platforms that collapse (disappear) when stepped on, then reappear.
  collapsingPlatforms?.forEach((collapsingPlatform) => {
    createCollapsingPlatform({ ...collapsingPlatform, parent: gameArea })
  })

  // Platform that starts moving along its path once the player steps on it.
  movingPlatforms?.forEach((movingPlatform) => {
    createMovingPlatform(
      { parent: gameArea },
      movingPlatform.introPath,
      movingPlatform.loopPath,
      movingPlatform.speed
    )
  })

  // Platforms that hover up and down in place.
  floatingPlatforms?.forEach((transform) => {
    createFloatingPlatform({ ...transform, parent: gameArea })
  })

  // Stepping-stone path revealed platform by platform as the player advances.
  if (spawningPlatformPaths) {
    createSpawningPlatformPath(
      gameArea,
      spawningPlatformPaths.start,
      spawningPlatformPaths.platforms,
      spawningPlatformPaths.spawnRadius
    )
  }

  // Rings that launch the player straight up when stepped into.
  boostRings?.forEach((transform) => {
    createBoostRing({ ...transform, parent: gameArea })
  })

  // Randomized boost-ring layout: one ring per group per y level, dealt fresh
  // on every map build (see pickBoostRings).
  if (boostRingGroups) {
    pickBoostRings(boostRingGroups).forEach((transform) => {
      createBoostRing({ ...transform, parent: gameArea })
    })
  }

  // Exploding mines with a scene-spanning damage laser.
  gliderMines?.forEach((transform) => {
    createGliderMine({ ...transform, parent: gameArea })
  })

  windForces?.forEach((transform) => {
    createWindForce({ ...transform, parent: gameArea })
  })

  // Wind columns that throw the player in one burst (boost-ring style), with a
  // per-column launch strength.
  windForceV2s?.forEach(({ strength, ...transform }) => {
    createWindForceV2({ ...transform, parent: gameArea }, strength)
  })

  if (windForceV3s && windForceV3s.length > 0) {
    const { strength, ...transform } = windForceV3s[Math.floor(Math.random() * windForceV3s.length)]
    createWindForceV3({ ...transform, parent: gameArea }, strength)
  }

  // Periodic meteor strikes: telegraphed by a ring + beam, then an explosion.
  // A for-of (rather than forEach) keeps gameArea narrowed to a defined Entity —
  // the narrowing is lost inside a callback.
  for (const meteor of meteors ?? []) {
    createMeteor(gameArea, meteor)
  }

  // Patrolling enemies that lock on and ram the player's last known spot.
  for (const enemy of enemies ?? []) {
    createEnemy(gameArea, enemy)
  }

  // Random maze: a fresh dead-end-rich layout every build (entry and reset).
  if (maze) {
    createMaze(gameArea, maze.start, maze.end)
  }
  // Gems are chosen server-side (20 random positions) and spawned when the
  // server replies to this request. A fresh id ensures only this run's reply is
  // applied (see applyServerGems).
  currentGems = []
  gemRequestId++
  sendRequestGems(currentLevel + 1, gemRequestId)

  movePlayerTo(getSpawnRequest())

  createStartTrigger(gameArea, startPosition, startSize)
  createFinishTrigger(gameArea, finishPosition, finishSize)
  createFallTrigger(gameArea, fallTriggerPosition)
  return gameArea  
} 

/**
 * Creates a trigger that starts the level timer when the player exits it
 * (i.e. leaves the start gate), so timing begins as the run actually starts.
 */
function createStartTrigger(parent: Entity, position: Vector3, size: Vector3) {
  const transform = { position, scale: size, parent }

  const handleStart = () => {
    startTimer()
    // Server owns the authoritative run timing; tell it the run has started.
    // getCurrentLevel() is 0-based, so send a 1-based map number (map1 -> 1).
    sendStartRun(getCurrentLevel() + 1)
  }

  createTrigger(transform, handleStart, true, 'exit')
}

/**
 * Creates a trigger that finishes the level when the player enters it.
 */
function createFinishTrigger(parent: Entity, position: Vector3, size: Vector3) {
  const transform = { position, scale: size, parent }

  // Guard so the run is recorded only once. The trigger is NOT triggerOnce, so a
  // player who reaches the finish without all gems can come back after collecting
  // the rest and finish then.
  let finished = false

  const handleFinish = () => {
    if (finished) return

    // Require every gem in the run to be collected before finishing.
    if (!allGemsCollected()) {
      showMissingGemsMessage(collectedGemCount(), currentGems.length)
      return
    }

    finished = true

    // Stop the local (UI) timer, then tell the server the run is complete so it
    // persists the collected gems and the run timing it has been tracking.
    finishTimer()
    sendFinishRun()
  }

  createTrigger(transform, handleFinish, false, 'enter')
}

/**
 * Creates a large trigger below the map to detect player falls.
 * When triggered, the player is respawned at the start position.
 *
 * @param position Map-defined position relative to the game area root; defaults
 *   to the volume centred below the map that all current maps use.
 */
function createFallTrigger(parent: Entity, position?: Vector3) {
  const fallHeight = 10
  const transform = {
    position: position ?? Vector3.create(0, -(SCENE_CENTER + fallHeight) / 2, 0),
    scale: Vector3.create(SCENE_SIZE, SCENE_CENTER - fallHeight, SCENE_SIZE),
    parent
  }

  const handleFall = () => {
    if (isLoadingProtectionActive()) {
      movePlayerTo(getSpawnRequest())
      return
    }

    sendFailedRun()
    showFallMessage()
    resetGameMap()
  }

  createTrigger(transform, handleFall)
}

/**
 * Cleans up the current level and resets gameplay state:
 * - Removes all entities in the game area
 * - Resets inventory and timer
 */
function cleanup() {
  if (gameArea) {
    removeEntityWithChildren(engine, gameArea)
    gameArea = undefined
  }

  // Stop any in-flight map-loading protection (e.g. leaving the runner mid-load).
  endLoadingProtection()

  // Abort a finish-preview movie in progress (level rebuild / experience switch).
  stopFinishIntro()

  // Clear any wind force still acting on the player (they were inside a column
  // when the level was torn down, so its exit trigger never fired).
  clearWindForces()

  currentGems = []
  spawningPlatformUpHandles = []
  resetInventory()
  resetTimer()
}

/** Maps a server gem-type number (1-4) to the scene's Gem enum. */
function gemFromType(type: number): Gem {
  // The Gem enum values are the numeric strings '1'-'4', matching the server's
  // gem-type numbers, so map by value — not by colour name, which can be
  // reordered and would silently desync the gem model and the saved gem column.
  if (type >= 1 && type <= 4) return String(type) as Gem
  return Gem.BLACK
}

/**
 * Spawns the gems the server selected for the current run.
 *
 * Replies are tagged with the request id they answer; anything that doesn't match
 * the latest request (e.g. a leftover reply from a previous level) is ignored.
 */
export function applyServerGems(requestId: number, serverGems: { x: number; y: number; z: number; gemType: number }[]): void {
  if (requestId !== gemRequestId) return
  if (gameArea === undefined) return

  currentGems = serverGems.map((g) => ({
    position: Vector3.create(g.x, g.y, g.z),
    gemType: gemFromType(g.gemType)
  }))

  for (const { position, gemType } of currentGems) {
    createGem({ position, parent: gameArea }, gemType, () => {
      addGemToInventory(gemType)
      // Once every gem is collected, reveal every spawning-platform guide arrow
      // (each is a no-op for towers that didn't request one).
      if (allGemsCollected()) spawningPlatformUpHandles.forEach((h) => h.revealPointerArrow())
    })
  }
}

/** The gems selected for the current run (used by the inventory UI). */
export function getCurrentGems(): SpawnedGem[] {
  return currentGems
}

/**
 * Whether the player has collected every gem placed in the current run.
 *
 * Returns false while the run's gems haven't been received yet (so the player
 * can't finish before any gems exist), and compares collected vs. required
 * counts per gem type.
 */
function allGemsCollected(): boolean {
  if (currentGems.length === 0) return false

  const required = new Map<Gem, number>()
  for (const { gemType } of currentGems) {
    required.set(gemType, (required.get(gemType) ?? 0) + 1)
  }

  for (const [gemType, count] of required) {
    if (getGemCountByType(gemType) < count) return false
  }

  return true
}

/** How many of the current run's gems the player has collected so far. */
function collectedGemCount(): number {
  const required = new Map<Gem, number>()
  for (const { gemType } of currentGems) {
    required.set(gemType, (required.get(gemType) ?? 0) + 1)
  }

  let collected = 0
  for (const [gemType, count] of required) {
    collected += Math.min(getGemCountByType(gemType), count)
  }
  return collected
}

/**
 * Tears down the game area and resets gameplay state. Call this when leaving the
 * runner experience: it removes the game area together with all of its children
 * (traps, gems, bounce entities and their triggers) so they aren't orphaned to
 * the scene root at (0,0,0) and duplicated on the next entry.
 */
export function destroyGameArea(): void {
  cleanup()
  // Leaving the runner: forget which map played the finish movie, so the next
  // visit shows it again (still only for maps not finished yet).
  resetFinishIntro()
}

/**
 * Restarts the current level. createGameArea() rebuilds the map with freshly
 * randomized gem positions, resets the timer back to 00:00 and the inventory
 * (via cleanup), recreates the start trigger so the run can begin again, and
 * respawns the player at the spawn point. Full health is restored on the server.
 *
 * Used when the player falls off the map and when their health reaches 0.
 */
export function resetGameMap(): void {
  sendResetHealth()
  createGameArea()
}
