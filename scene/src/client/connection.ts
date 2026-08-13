/**
 * Client side of the link to the Multiplayer Server.
 *
 * This module deliberately imports nothing from the scene, so gameplay modules
 * can import it freely. The handlers that drive the scene live in
 * `client/serverEvents.ts`.
 */
import { RealmInfo, engine } from '@dcl/sdk/ecs'
import { binaryMessageBus, isStateSyncronized } from '@dcl/sdk/network'
import { CommsMessage } from '@dcl/sdk/network/binary-message-bus'
import { getPlayer } from '@dcl/sdk/players'

import { log } from '../back-ports/backPorts'
import { HitSource, room } from '../shared/messages'
import { showCenterMessage } from '../ui/centerMessage'

/**
 * How long a client trusts the last thing it heard from the server. The server
 * pulses every 3 s, so this is ~3 missed pulses.
 */
const SERVER_SILENCE_MS = 10_000

/** How often to re-announce ourselves while the server has not answered. */
const JOIN_RETRY_MS = 2500

/**
 * How often to re-ask the server for the CRDT state while unsynced. This
 * duplicates a retry the SDK is supposed to do itself — see
 * `keepAskingForState()` for why it cannot be relied on.
 */
const STATE_REQUEST_RETRY_MS = 2000

/** How often to remind the player that we're still waiting. */
const NOTICE_REPEAT_MS = 8000

/** Grace period before the first notice, to cover scene load. */
const NOTICE_DELAY_MS = 5000

/**
 * How long the CRDT handshake may take before it stops being a normal cold
 * start. A server that was asleep takes ~15 s to answer in production; past this
 * the client is genuinely wedged, and the wording says so.
 */
const HANDSHAKE_PATIENCE_MS = 30_000

let serverAlive = false
/** Client-clock time of the last message received from the server. */
let lastServerMessageAt = 0

let elapsedMs = 0
let nextJoinAt = 0
let nextNoticeAt = NOTICE_DELAY_MS
let nextStateRequestAt = 0
/** When the client last had an unsynced room, to tell a cold start from a wedge. */
let unsyncedSince = 0

/** Re-sent after a (re)join so a request lost during a cold start isn't fatal. */
let lastGemRequest: { map: number; requestId: number } | undefined
/** Id of the newest gem deal actually received, so an answered request is never
 * re-sent — re-dealing mid-run would move the gems and reset the progress. */
let answeredGemRequestId: number | undefined
let lastLeaderboardMap = 1

/** Whether the headless server has been heard from recently. */
export function isServerAlive(): boolean {
  return serverAlive
}

/**
 * Starts the connection watcher.
 *
 * Liveness is judged purely by inbound traffic: if the server has said anything
 * — a pulse or any reply — within SERVER_SILENCE_MS, it is up. Using the same
 * transport gameplay uses means the two can never disagree, which a synced
 * component could (its delivery and its `Int64` decode are separate mechanisms
 * that can fail on their own, and did on at least one runtime).
 */
export function initConnection(): void {
  stopAnsweringStateRequests()
  watchServerTraffic()
  engine.addSystem(connectionSystem)
}

/**
 * Stops this client from answering other clients' CRDT state requests.
 *
 * The SDK answers `REQ_CRDT_STATE` from *every* peer, not just the server. In an
 * authoritative-server scene that is always wrong — the server is the only
 * source of state — and it is actively harmful, because of how the requester
 * handles the reply:
 *
 * ```js
 * binaryMessageBus.on(CommsMessage.RES_CRDT_STATE, async (data, sender) => {
 *   requestingState = false                                  // cleared first…
 *   if (... || sender !== AUTH_SERVER_PEER_ID) return        // …then bails out
 *   stateIsSyncronized = true                                // never reached
 * ```
 *
 * and the SDK's retry only runs `if (requestingState && !stateIsSyncronized)`.
 * So when a second player joins, the *first* player's client answers their
 * request, which clears `requestingState` without syncing and permanently closes
 * the retry gate: the second player never asks again and stays unsynced forever.
 * That is why only the first player into the scene could ever connect.
 *
 * `binaryMessageBus.on()` keeps a single callback per message type, so
 * registering a no-op removes this client from the responder set.
 */
function stopAnsweringStateRequests(): void {
  binaryMessageBus.on(CommsMessage.REQ_CRDT_STATE, () => {
    // Intentionally empty: only the authoritative server may serve state.
  })
}

/**
 * Re-asks the server for the CRDT state until we are synced.
 *
 * Belt and braces alongside `stopAnsweringStateRequests()`: that removes our own
 * interference, this survives interference from anything else that answers a
 * state request, because it does not depend on the SDK's `requestingState` flag.
 * Sending is impossible until the state syncs (`room.send` only queues), so this
 * is the one thing that must not be allowed to stall.
 */
function keepAskingForState(): void {
  if (elapsedMs < nextStateRequestAt) return
  nextStateRequestAt = elapsedMs + STATE_REQUEST_RETRY_MS
  // Emitted unconditionally, even before comms reports itself connected: the
  // SDK's own request is gated on `isConnectedSceneRoom`, so if that flag is the
  // thing that never turns true, a gated retry would never fire either.
  binaryMessageBus.emit(CommsMessage.REQ_CRDT_STATE, new Uint8Array())
}

/** Whether comms says this client is in the scene's room at all. */
function isInSceneRoom(): boolean {
  return RealmInfo.getOrNull(engine.RootEntity)?.isConnectedSceneRoom === true
}

/**
 * Every server -> client message doubles as proof of life. Registered here
 * rather than in serverEvents.ts so liveness does not depend on the scene
 * handlers being wired up (the room allows several listeners per message).
 */
function watchServerTraffic(): void {
  const markAlive = () => {
    lastServerMessageAt = Date.now()
  }
  room.onMessage('serverPulse', markAlive)
  room.onMessage('health', markAlive)
  room.onMessage('resources', markAlive)
  room.onMessage('maps', markAlive)
  room.onMessage('gems', markAlive)
  room.onMessage('runFinished', markAlive)
  room.onMessage('leaderboard', markAlive)
}

function connectionSystem(dt: number): void {
  elapsedMs += dt * 1000

  // The room has to be synced before anything can actually leave the client —
  // until then `room.send` only queues.
  const roomSynced = isStateSyncronized()
  if (roomSynced) {
    unsyncedSince = 0
  } else {
    if (unsyncedSince === 0) unsyncedSince = elapsedMs
    keepAskingForState()
  }

  const alive = lastServerMessageAt > 0 && Date.now() - lastServerMessageAt < SERVER_SILENCE_MS

  if (alive && !serverAlive) {
    serverAlive = true
    log('server is alive')
    resendPending()
  } else if (!alive && serverAlive) {
    serverAlive = false
    log('server has gone quiet')
  }

  if (serverAlive) {
    nextNoticeAt = elapsedMs + NOTICE_DELAY_MS
    return
  }

  // Keep announcing ourselves until the server answers. Unlike waiting for an
  // edge on some other signal, this retries forever and needs nothing to have
  // arrived first, so a cold start, a server restart, or a single dropped join
  // all recover the same way.
  if (roomSynced && elapsedMs >= nextJoinAt) {
    nextJoinAt = elapsedMs + JOIN_RETRY_MS
    sendJoin()
  }

  if (elapsedMs >= nextNoticeAt) {
    nextNoticeAt = elapsedMs + NOTICE_REPEAT_MS
    showCenterMessage(waitingMessage(roomSynced))
  }
}

/**
 * What to tell the player while we wait.
 *
 * Each state is worded distinctly on purpose: these devices cannot have a
 * console attached, so the sentence on screen is the only diagnostic available.
 * The distinction that matters is whether comms ever put us in the scene room —
 * without that, no request can leave the client and nothing else is meaningful.
 *
 *  - not in the scene room       -> comms never connected us (below the scene)
 *  - in the room, not synced yet -> the normal cold-start handshake
 *  - in the room, still unsynced -> the server is not answering state requests
 *  - synced, but server silent   -> handshake done; server booting or gone
 */
function waitingMessage(roomSynced: boolean): string {
  if (roomSynced) return 'Waking up the game server…'

  const patienceExpired = elapsedMs - unsyncedSince >= HANDSHAKE_PATIENCE_MS
  if (!patienceExpired) return 'Connecting to the game server…'

  return isInSceneRoom()
    ? 'Server not answering — room OK, no state reply.'
    : 'No scene room — comms did not connect this player.'
}

function sendJoin(): void {
  let name = 'dcl-guest'
  let isGuest = true
  try {
    const player = getPlayer()
    if (player) {
      name = player.name || name
      isGuest = player.isGuest
    }
  } catch (err) {
    log('getPlayer() unavailable', err)
  }
  room.send('join', { name, isGuest })
}

/**
 * Replays the requests whose answers the scene cannot do without. Anything sent
 * while the server was cold-starting was dropped; without this the runner would
 * sit gemless and the lobby board empty until the player triggered them again.
 */
function resendPending(): void {
  // Only an *unanswered* deal is re-requested: asking again for gems the scene
  // already spawned would deal a different layout and wipe the run's progress.
  if (lastGemRequest && lastGemRequest.requestId !== answeredGemRequestId) {
    room.send('requestGems', lastGemRequest)
  }
  room.send('requestLeaderboard', { map: lastLeaderboardMap })
}

/** Called by the `gems` handler so the deal is not requested a second time. */
export function noteGemsReceived(requestId: number): void {
  answeredGemRequestId = requestId
}

export function sendHitBallTrap(): void {
  room.send('hit', { source: HitSource.BALL_TRAP })
}

export function sendHitLaserWall(): void {
  room.send('hit', { source: HitSource.LASER_WALL })
}

export function sendHitSwingBeam(): void {
  room.send('hit', { source: HitSource.SWING_BEAM })
}

export function sendHitBounce(): void {
  room.send('hit', { source: HitSource.BOUNCE })
}

export function sendHitGliderMine(): void {
  room.send('hit', { source: HitSource.GLIDER_MINE })
}

export function sendResetHealth(): void {
  room.send('resetHealth', { nonce: 0 })
}

export function sendRequestGems(map: number, requestId: number): void {
  log('sendRequestGems', map, requestId)
  lastGemRequest = { map, requestId }
  room.send('requestGems', lastGemRequest)
}

export function sendRequestLeaderboard(map: number): void {
  lastLeaderboardMap = map
  room.send('requestLeaderboard', { map })
}

export function sendCollectGem(gemType: number): void {
  room.send('collectGem', { gemType })
}

export function sendStartRun(map: number): void {
  log('sendStartRun', map)
  room.send('startRun', { map })
}

export function sendFinishRun(): void {
  log('sendFinishRun')
  room.send('finishRun', { nonce: 0 })
}

export function sendFailedRun(): void {
  room.send('failedRun', { nonce: 0 })
}
