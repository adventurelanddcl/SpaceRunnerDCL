/**
 * Server -> scene wiring. Client-only.
 */
import { room } from '../shared/messages'
import { log } from '../back-ports/backPorts'
import { getCurrentExperience } from '../experience-manager'
import { updateSpeedRunLeaderboard } from '../experience-manager/lobbyExperience'
import { applyServerGems, resetGameMap } from '../experience-manager/runner/gameArea'
import { setUnlockedMaps } from '../experience-manager/runner/gameState'
import { showDeathMessage } from '../ui/centerMessage'
import { clearDamageIndicator, showDamageIndicator } from '../ui/damageIndicator'
import { changeHealthPercent, setResourceCounts, showRunFinished } from '../ui/gameUI'
import { noteGemsReceived } from './connection'

/**
 * Previous health, so a drop can be told apart from a heal or the reset that
 * follows a death. Undefined until the first update, which keeps the initial
 * sync from flashing the damage border on join.
 */
let previousHealth: number | undefined

export function initServerEvents(): void {
  room.onMessage('health', ({ health, healthLevel }) => {
    const max = healthLevel > 0 ? healthLevel : 1
    changeHealthPercent((health / max) * 100)

    // Took a hit: flash the red damage border.
    if (previousHealth !== undefined && health < previousHealth && health > 0) {
      showDamageIndicator()
    }
    previousHealth = health

    // Out of health: restart the level (only while actually in the runner).
    // resetGameMap restores health on the server, so this won't re-trigger.
    if (health <= 0 && getCurrentExperience() === 'runner') {
      log('player out of health -> resetGameMap')
      // The death message takes over from here; drop any in-flight flash so it
      // doesn't keep blinking through the respawn.
      clearDamageIndicator()
      showDeathMessage()
      resetGameMap()
    }
  })

  room.onMessage('resources', ({ gem1, gem2, gem3, gem4 }) => {
    setResourceCounts({ gem1, gem2, gem3, gem4 })
  })

  room.onMessage('maps', ({ unlocked }) => {
    setUnlockedMaps(unlocked)
  })

  // The gems the server dealt for this run.
  room.onMessage('gems', ({ requestId, gems }) => {
    log('gems received', gems.length)
    noteGemsReceived(requestId)
    applyServerGems(requestId, gems)
  })

  // The server confirms a completed run with the exact saved time.
  room.onMessage('runFinished', ({ minutes, seconds, milliseconds }) => {
    const time = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
    log('runFinished', time)
    showRunFinished(`FINISHED\n${time}`)
  })

  // One server now serves every player, so a board update can be for a map this
  // client isn't showing; the lobby drops those.
  room.onMessage('leaderboard', ({ map, entries }) => {
    updateSpeedRunLeaderboard(map, entries)
  })
}
