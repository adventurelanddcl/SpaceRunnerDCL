/**
 * Center-screen "big text" messages shown briefly for game events
 * (falling, dying, reaching the finish without all gems).
 *
 * The state lives in its own module so both the UI (which renders it, in
 * gameUI.tsx) and the gameplay logic (which triggers it) can use it without a
 * circular import between those files.
 */

/** How long (ms) a message stays on screen. */
const CENTER_MESSAGE_DURATION = 3000

let message = ''
let visibleUntil = 0

/** Shows big centered text for CENTER_MESSAGE_DURATION ms. */
export function showCenterMessage(text: string): void {
  message = text
  visibleUntil = Date.now() + CENTER_MESSAGE_DURATION
}

/**
 * Current message and whether it should still be shown. Read every frame by the
 * renderer; the message hides itself once its time has elapsed.
 */
export function getCenterMessage(): { text: string; visible: boolean } {
  return { text: message, visible: message !== '' && Date.now() < visibleUntil }
}

const FALL_MESSAGES = ['Watch your step!', 'Missed the ledge!', 'Gravity wins again!', 'Down it goes...']
const DEATH_MESSAGES = ['Wasted!', 'Wiped Out!', 'Failed!', 'K.O.']

function randomFrom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

/** Random message shown when the player falls off the map. */
export function showFallMessage(): void {
  showCenterMessage(randomFrom(FALL_MESSAGES))
}

/** Random message shown when the player's health reaches 0. */
export function showDeathMessage(): void {
  showCenterMessage(randomFrom(DEATH_MESSAGES))
}

/** Message shown when the player reaches the finish without collecting all gems. */
export function showMissingGemsMessage(collected: number, total: number): void {
  showCenterMessage(`Missing gems! Collected ${collected} out of ${total} Required!`)
}
