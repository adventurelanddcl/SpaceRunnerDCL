/**
 * Runner experience
 */
import { movePlayerTo } from '~system/RestrictedActions'
import type { Experience } from './experienceManager'
import { createGameArea, destroyGameArea, getSpawnRequest } from './runner/gameArea'
import { sendResetHealth } from '../client/connection'
import { hideOtherAvatars } from './avatarVisibility'


export async function enterRunner(): Promise<void> {
  // Start the runner with full health (reset any damage from a previous session).
  sendResetHealth()

  // Hide every other player's avatar/name while running.
  hideOtherAvatars()

  // createGameArea() builds the level and tracks the game area entity internally;
  // destroyGameArea() (on exit) removes it together with all of its children.
  createGameArea()

  try {
    // Same per-map spawn request (position + camera/avatar targets) the game
    // area uses for respawns, so entry and reset behave identically.
    await movePlayerTo(getSpawnRequest())
    console.log('movePlayerTo ok')
  } catch (err) {
    console.log('movePlayerTo failed', err)
  }
}

function exitRunner(): void {
  // Remove the game area and every child entity (traps, gems, bounce, triggers)
  // so nothing is orphaned to the scene root when returning to the lobby.
  destroyGameArea()
}

export const runnerExperience: Experience = {
  enter: enterRunner,
  exit: exitRunner,
}

