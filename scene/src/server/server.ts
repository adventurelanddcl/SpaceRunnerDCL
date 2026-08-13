/**
 * The headless Multiplayer Server. Server-only.
 */
import { Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { binaryMessageBus, syncEntity } from '@dcl/sdk/network'
import { CommsMessage } from '@dcl/sdk/network/binary-message-bus'
import { AUTH_SERVER_PEER_ID } from '@dcl/sdk/network/message-bus-sync'
import { engineToCrdt } from '@dcl/sdk/network/state'

import { room } from '../shared/messages'
import { MAP_COUNT, flushProfiles, getProfile, loadProfile, markProfileDirty, releaseProfile } from './profiles'
import { flushBoards, getBoard, preloadBoards, recordRun, toMessageEntries } from './leaderboard'
import { getConnectedAddresses, getPlayerName } from './players'
import {
  Session,
  allSessions,
  applyDamage,
  closeSession,
  collectGem,
  collectedByType,
  collectedCount,
  dealGems,
  failRun,
  getSession,
  openSession,
  resetHealth,
  runIsComplete,
  startRun
} from './sessions'
import { TOTAL_GEMS } from './gemPools'

/** How often the server re-checks who is in the scene. */
const PRESENCE_POLL_MS = 3000

/** Debounced persistence for anything not already flushed at a checkpoint. */
const FLUSH_MS = 30_000

/**
 * How often the server broadcasts proof of life. Clients cannot tell "no server
 * yet" from "connected room replaying an old snapshot" any other way.
 */
const PULSE_MS = 3000

/**
 * Fixed sync id for the one synced entity. It is a singleton, so a restarted
 * server re-claims the same network identity instead of leaving a dead entity
 * behind on every boot. Only used by the `'entity'` handshake strategy.
 */
const PRESENCE_SYNC_ID = 1

const HANDSHAKE_STRATEGY: 'stub' | 'entity' | 'none' = 'entity'

const HANDSHAKE_STUB = new Uint8Array([0, 0, 0, 0])

let pulseAcc = 0
let pulseSeq = 0
let presenceAcc = 0
let flushAcc = 0

/** Addresses the presence poll has already opened a session for. */
const knownPlayers = new Set<string>()
/** In-flight session opens, so two messages in one tick don't double-load. */
const opening = new Map<string, Promise<Session | undefined>>()

export function initServer(): void {
  console.log('[SERVER] Space Runner multiplayer server starting')

  installHandshakeStrategy()

  registerMessageHandlers()

  void bootstrap()

  // Announce immediately, so the first client to arrive after a cold start does
  // not have to wait a full interval to learn the server is up.
  room.send('serverPulse', { seq: pulseSeq })

  engine.addSystem(serverSystem)
}

/**
 * Sets up how the server answers a client's `REQ_CRDT_STATE`.
 *
 * A client cannot send anything until its CRDT handshake completes — until then
 * `room.send()` only queues — and the handshake completes only when the server's
 * `RES_CRDT_STATE` reaches it. See HANDSHAKE_STRATEGY for why this is a switch.
 */
function installHandshakeStrategy(): void {
  console.log('[SERVER] handshake strategy:', HANDSHAKE_STRATEGY)

  if (HANDSHAKE_STRATEGY === 'entity') {
    publishServerPresence()
    answerStateRequestsWithLogging()
    return
  }

  if (HANDSHAKE_STRATEGY === 'stub') {
    binaryMessageBus.on(CommsMessage.REQ_CRDT_STATE, (_data, sender) => {
      binaryMessageBus.emit(CommsMessage.RES_CRDT_STATE, HANDSHAKE_STUB, [sender])
    })
  }
}

function answerStateRequestsWithLogging(): void {
  binaryMessageBus.on(CommsMessage.REQ_CRDT_STATE, (_data, sender) => {
    const chunks = engineToCrdt(engine)
    console.log(`[SERVER] state request from "${sender}" -> replying with ${chunks.length} chunk(s)`)

    if (chunks.length === 0) {
      binaryMessageBus.emit(CommsMessage.RES_CRDT_STATE, new Uint8Array(), [sender])
      return
    }
    for (const chunk of chunks) {
      binaryMessageBus.emit(CommsMessage.RES_CRDT_STATE, chunk, [sender])
    }
  })
}

/**
 * Publishes a single synced entity carrying only a built-in `Transform`, so the
 * SDK's own handshake reply has real state in it. Used by the `'entity'`
 * strategy. The entity has no renderable component, so nothing is drawn; the
 * position only keeps it clear of the playfield. Written once and never
 * mutated, so it adds no recurring CRDT traffic.
 */
function publishServerPresence(): void {
  const entity = engine.addEntity()
  Transform.create(entity, { position: Vector3.create(0, -1000, 0) })
  // Built-in components validate per entity (custom ones validate globally).
  Transform.validateBeforeChange(entity, (value) => value.senderAddress === AUTH_SERVER_PEER_ID)
  syncEntity(entity, [Transform.componentId], PRESENCE_SYNC_ID)
}

async function bootstrap(): Promise<void> {
  await preloadBoards()
  console.log('[SERVER] ready')
}

// ---------------------------------------------------------------------------
// Player lifecycle
// ---------------------------------------------------------------------------

/**
 * Returns the session for a caller, opening it (and loading their stored
 * profile) the first time we hear from them. The server also opens sessions on
 * its own from the presence poll, so a client whose `join` was lost still works.
 *
 * `peerId` is the address exactly as the sender reported it; it is what replies
 * are addressed to. The presence poll seeds it from the player's identity, and
 * the first message from that player corrects it.
 */
async function ensurePlayer(address: string, options?: { name?: string; peerId?: string }): Promise<Session | undefined> {
  const key = address.toLowerCase()
  const peerId = options?.peerId ?? address
  const reportedName = options?.name

  const existing = getSession(key)
  if (existing) {
    if (options?.peerId) existing.peerId = options.peerId
    if (reportedName && reportedName !== existing.name) {
      existing.name = reportedName
      const profile = getProfile(key)
      if (profile) {
        profile.name = reportedName
        markProfileDirty(key)
      }
    }
    return existing
  }

  const inFlight = opening.get(key)
  if (inFlight) return await inFlight

  const open = (async () => {
    try {
      const name = reportedName || getPlayerName(key) || 'Anonymous'
      const profile = await loadProfile(key, name)
      const session = openSession(key, peerId, profile.name, profile.healthLevel)
      // Marked known here, so the presence poll doesn't open it a second time.
      // On failure it stays unknown and the next poll retries.
      knownPlayers.add(key)
      // Logged with its origin: "presence" means the runtime told the server this
      // player is in the scene, which happens whether or not their client can
      // send anything. A player that only ever appears via presence, never with
      // "join", is one whose CRDT handshake never completed.
      console.log(
        `[SERVER] session opened for ${key} (${profile.name}) via ${reportedName ? 'join' : 'presence'}`
      )
      return session
    } catch (err) {
      console.log('[SERVER] failed to open session for', key, err)
      return undefined
    } finally {
      opening.delete(key)
    }
  })()

  opening.set(key, open)
  return await open
}

/**
 * The session of a player who just sent a message, with their reply address
 * refreshed from the sender the transport reported.
 */
function sessionOf(from: string): Session | undefined {
  const session = getSession(from)
  if (session) session.peerId = from
  return session
}

/** Pushes everything the scene needs on entry. */
function sendPlayerState(session: Session): void {
  const to = [session.peerId]
  const profile = getProfile(session.address)

  room.send('health', { health: session.health, healthLevel: session.healthLevel }, { to })
  if (profile) {
    room.send(
      'resources',
      { gem1: profile.gem1, gem2: profile.gem2, gem3: profile.gem3, gem4: profile.gem4 },
      { to }
    )
    room.send('maps', { unlocked: profile.maps }, { to })
  }
  // The lobby opens on map 1; the client re-requests whichever map it is
  // actually showing right after joining.
  void getBoard(1).then(() => room.send('leaderboard', { map: 1, entries: toMessageEntries(1) }, { to }))
}

async function releasePlayer(address: string): Promise<void> {
  const key = address.toLowerCase()
  closeSession(key)
  await releaseProfile(key)
  console.log('[SERVER] released', key)
}

// ---------------------------------------------------------------------------
// Message handlers 
// ---------------------------------------------------------------------------

function registerMessageHandlers(): void {
  room.onMessage('join', (data, context) => {
    if (!context?.from) return
    console.log('[SERVER] join', context.from, data.name, 'guest:', data.isGuest)
    void ensurePlayer(context.from, { name: data.name, peerId: context.from }).then((session) => {
      // Always re-push: a join is also how a client recovers after a scene
      // reload or after the server restarted under a player who never left.
      if (session) sendPlayerState(session)
    })
  })

  room.onMessage('hit', (data, context) => {
    if (!context?.from) return
    const session = sessionOf(context.from)
    if (!session) return
    const health = applyDamage(session, data.source)
    if (health === undefined) {
      console.log('[SERVER] unknown hit source', data.source, 'from', context.from)
      return
    }
    room.send('health', { health, healthLevel: session.healthLevel }, { to: [session.peerId] })
  })

  room.onMessage('resetHealth', (_data, context) => {
    if (!context?.from) return
    const session = sessionOf(context.from)
    if (!session) return
    const health = resetHealth(session)
    room.send('health', { health, healthLevel: session.healthLevel }, { to: [session.peerId] })
  })

  room.onMessage('requestGems', (data, context) => {
    if (!context?.from) return
    void ensurePlayer(context.from, { peerId: context.from }).then((session) => {
      if (!session) return
      const map = data.map || 1
      const gems = dealGems(session, map, data.requestId ?? 0)
      console.log('[SERVER] requestGems', session.address, 'map', map, '->', gems.length, 'gems')
      room.send(
        'gems',
        {
          requestId: session.requestId,
          gems: gems.map((gem) => ({ x: gem.x, y: gem.y, z: gem.z, gemType: gem.gemType }))
        },
        { to: [session.peerId] }
      )
    })
  })

  room.onMessage('requestLeaderboard', (data, context) => {
    if (!context?.from) return
    const map = data.map || 1
    const to = [context.from]
    // A request can beat the bootstrap preload, so make sure the board is
    // actually loaded before answering rather than replying with an empty one.
    void getBoard(map).then(() => room.send('leaderboard', { map, entries: toMessageEntries(map) }, { to }))
  })

  room.onMessage('collectGem', (data, context) => {
    if (!context?.from) return
    const session = sessionOf(context.from)
    if (!session) return
    collectGem(session, data.gemType)
  })

  room.onMessage('startRun', (data, context) => {
    if (!context?.from) return
    const session = sessionOf(context.from)
    if (!session) return
    startRun(session, data.map || 0)
    console.log('[SERVER] startRun', session.address, 'map', session.map)
  })

  room.onMessage('finishRun', (_data, context) => {
    if (!context?.from) return
    void handleFinishRun(context.from)
  })

  room.onMessage('failedRun', (_data, context) => {
    if (!context?.from) return
    const session = sessionOf(context.from)
    if (!session) return
    failRun(session)
  })
}

async function handleFinishRun(from: string): Promise<void> {
  const session = sessionOf(from)
  if (!session) return

  const profile = getProfile(session.address)
  if (!profile) {
    console.log('[SERVER] finishRun without a profile for', session.address)
    return
  }

  // The map can only be finished with every gem collected. The server dealt the
  // gems and matched every pickup against one of them, so this is exact — there
  // is no overflow to clamp.
  if (!runIsComplete(session)) {
    console.log(
      `[SERVER] finishRun rejected: only ${collectedCount(session)}/${TOTAL_GEMS} gems collected by ${session.address}`
    )
    return
  }

  const finishedMap = session.map
  const counts = collectedByType(session)
  const finishTime = Date.now()
  const startTime = session.startTime > 0 ? session.startTime : finishTime
  const elapsedMs = Math.max(0, finishTime - startTime)
  const totalSeconds = Math.floor(elapsedMs / 1000)

  profile.gem1 += counts[1] ?? 0
  profile.gem2 += counts[2] ?? 0
  profile.gem3 += counts[3] ?? 0
  profile.gem4 += counts[4] ?? 0
  profile.runTotal += 1

  // Unlock the next map now that this one is finished.
  const nextMap = finishedMap + 1
  if (nextMap >= 2 && nextMap <= MAP_COUNT) {
    profile.maps[nextMap - 1] = true
    console.log('[SERVER] unlocked map', nextMap, 'for', session.address)
  }
  markProfileDirty(session.address)

  // The run is over — clearing it also stops a second finish from crediting it.
  failRun(session)

  const to = [session.peerId]
  room.send(
    'runFinished',
    {
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
      milliseconds: elapsedMs % 1000
    },
    { to }
  )
  room.send('resources', { gem1: profile.gem1, gem2: profile.gem2, gem3: profile.gem3, gem4: profile.gem4 }, { to })
  room.send('maps', { unlocked: profile.maps }, { to })

  console.log(
    '[SERVER] finishRun',
    session.address,
    'map',
    finishedMap,
    'time',
    `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
  )

  // Board. Every client gets the update; the lobby ignores maps it isn't showing.
  if (await recordRun(finishedMap, session.address, profile.name, elapsedMs)) {
    room.send('leaderboard', { map: finishedMap, entries: toMessageEntries(finishedMap) })
  }

  // Finishing a run is the checkpoint at which everything is persisted.
  await flushProfiles()
  await flushBoards()
}

// ---------------------------------------------------------------------------
// Systems
// ---------------------------------------------------------------------------

function serverSystem(dt: number): void {
  const elapsed = dt * 1000

  pulseAcc += elapsed
  if (pulseAcc >= PULSE_MS) {
    pulseAcc = 0
    // Only the fact that it arrived matters; the counter just keeps successive
    // pulses distinguishable in a log.
    pulseSeq = (pulseSeq + 1) % 1_000_000
    room.send('serverPulse', { seq: pulseSeq })
  }

  presenceAcc += elapsed
  if (presenceAcc >= PRESENCE_POLL_MS) {
    presenceAcc = 0
    pollPresence()
  }

  flushAcc += elapsed
  if (flushAcc >= FLUSH_MS) {
    flushAcc = 0
    void flushAll()
  }
}

/** Opens sessions for arrivals and drops the state of players who left. */
function pollPresence(): void {
  const connected = getConnectedAddresses()
  const connectedKeys = new Set(connected.map((address) => address.toLowerCase()))

  // Logged every poll while anyone is here. This is the one view of the scene
  // that does not depend on a client being able to *send* anything: the runtime
  // reports players via PlayerIdentityData regardless. A player who shows up
  // here but never sends `join` has a client that cannot complete its handshake.
  if (connected.length > 0) {
    console.log(
      `[SERVER] present: ${connected.length} — ${connected.join(', ')} | sessions: ${allSessions().length}`
    )
  }

  // Arrivals the server noticed before (or without) hearing a `join`: open
  // their session and push their state unprompted. The address is passed
  // verbatim as the reply address — see getConnectedAddresses().
  for (const address of connected) {
    if (knownPlayers.has(address.toLowerCase())) continue
    void ensurePlayer(address, { peerId: address }).then((session) => {
      if (session) sendPlayerState(session)
    })
  }

  for (const session of allSessions()) {
    if (connectedKeys.has(session.address)) continue
    knownPlayers.delete(session.address)
    void releasePlayer(session.address)
  }
}

async function flushAll(): Promise<void> {
  await flushProfiles()
  await flushBoards()
}
