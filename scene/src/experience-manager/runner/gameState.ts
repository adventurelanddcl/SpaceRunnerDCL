import { engine, Entity } from '@dcl/sdk/ecs'

import { maps } from './maps'
import { formatTime } from './utils'

/**
 * Represents the global game state.
 */
type GameState = {
  root: Entity
  currentLevel: number
  startTime?: number
  finishTime?: number
}

const state: GameState = {
  root: engine.addEntity(),
  currentLevel: 0
}

export function getRootEntity(): Entity {
  return state.root
}

export function setRootEntity(root: Entity) {
  state.root = root
}

export function getCurrentLevel(): number {
  return state.currentLevel
}

/** Selects a specific level (map index)*/
export function setCurrentLevel(level: number): void {
  if (level < 0 || level >= maps.length) return
  state.currentLevel = level
}

/**
 * Which maps the player has unlocked (index 0 = map1), synced from the server.
 * Defaults to map1 only so locked maps can't be entered before the first sync.
 */
let unlockedMaps: boolean[] = [true, false, false, false, false, false, false, false, false, false]

export function setUnlockedMaps(unlocked: boolean[]): void {
  unlockedMaps = unlocked
}

export function getUnlockedMaps(): boolean[] {
  return unlockedMaps
}

/** Highest unlocked map index (0-based). Defaults to 0 (map1) if none. */
export function getLastUnlockedMap(): number {
  let last = 0
  for (let i = 0; i < unlockedMaps.length; i++) {
    if (unlockedMaps[i]) last = i
  }
  return last
}

/**
 * Attempts to move to the next level.
 * Returns true if level was increased, false if already at last level
 */
export function increaseCurrentLevel(): boolean {
  const isLastLevel = state.currentLevel >= maps.length - 1
  if (isLastLevel) {
      state.currentLevel = 0
      return false
  } 

  state.currentLevel += 1
  return true
}

export function startTimer() {
  state.startTime = Date.now()
  state.finishTime = undefined // ensure clean state
}

export function getStartTime(): number | undefined {
  return state.startTime
}

export function finishTimer() {
  if (!state.startTime) return // guard against invalid usage
  state.finishTime = Date.now()
}

export function getFinishTime(): number | undefined {
  return state.finishTime
}

export function resetTimer() {
  state.finishTime = undefined
  state.startTime = undefined
}

export function isLevelFinished(): boolean {
  return state.finishTime !== undefined
}

export function getElapsedTime(): number {
  // If the timer was never started, return 0 to indicate no elapsed time
  if (!state.startTime) return 0

  // Use the recorded finish time if available, otherwise use current time
  const finishTime = state.finishTime || Date.now()

  return finishTime - state.startTime
}

export function getFormattedElapsedTime(): string {
  const elapsedTime = getElapsedTime()
  return formatTime(elapsedTime)
}
