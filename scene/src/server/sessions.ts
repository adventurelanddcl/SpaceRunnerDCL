/**
 * Live per-player run state. Server-only, in memory (never persisted).
 */
import { Vector3 } from '@dcl/sdk/math'

import { SCENE_CENTER } from '../config'
import { HitSource } from '../shared/messages'
import { pickGems, SelectedGem, TOTAL_GEMS } from './gemPools'
import { getPlayerPosition } from './players'

/**
 * Scene-local position of the runner's game-area root (index.ts parents the
 * whole level to it). Gem positions from the pools are relative to this.
 */
const GAME_AREA_ORIGIN = Vector3.create(SCENE_CENTER, SCENE_CENTER, SCENE_CENTER)

/**
 * How far from a gem a player may be and still be credited with collecting it.
 */
const GEM_PICKUP_RADIUS = 12

/** Damage per hit source. The client says *what* hit it, never how much. */
const DAMAGE: Record<string, number> = {
  [HitSource.BALL_TRAP]: 5,
  [HitSource.LASER_WALL]: 5,
  [HitSource.SWING_BEAM]: 5,
  [HitSource.BOUNCE]: 1,
  [HitSource.GLIDER_MINE]: 5
}

export type Session = {
  /** Lower-cased wallet address. The key for Storage and every lookup. */
  address: string
  /**
   * The comms peer id exactly as the transport reported it, which is what a
   * reply has to be addressed to. It is kept verbatim rather than normalised,
   * because `{ to: [...] }` is matched by the transport as an opaque string.
   * Seeded from the player's identity and corrected the first time they send
   * a message.
   */
  peerId: string
  name: string
  health: number
  healthLevel: number
  /** 1-based map of the current run; 0 when no map is built. */
  map: number
  /** Id of the gem deal this session is playing; stale replies are ignored. */
  requestId: number
  gems: SelectedGem[]
  collected: boolean[]
  /** Epoch ms the run clock started; 0 when no run is in progress. */
  startTime: number
}

const sessions = new Map<string, Session>()

export function getSession(address: string): Session | undefined {
  return sessions.get(address.toLowerCase())
}

/** Creates (or returns) the session for a joining player. */
export function openSession(address: string, peerId: string, name: string, healthLevel: number): Session {
  const key = address.toLowerCase()
  const existing = sessions.get(key)
  if (existing) {
    existing.peerId = peerId
    existing.name = name
    existing.healthLevel = healthLevel
    // A rejoin means a fresh scene load: nothing is built yet.
    existing.health = healthLevel
    existing.map = 0
    existing.gems = []
    existing.collected = []
    existing.startTime = 0
    return existing
  }

  const session: Session = {
    address: key,
    peerId,
    name,
    health: healthLevel,
    healthLevel,
    map: 0,
    requestId: 0,
    gems: [],
    collected: [],
    startTime: 0
  }
  sessions.set(key, session)
  return session
}

export function closeSession(address: string): void {
  sessions.delete(address.toLowerCase())
}

/** Every open session (used by the periodic flush / prune). */
export function allSessions(): Session[] {
  return [...sessions.values()]
}

/**
 * Deals a fresh set of gems for a map build. This also resets what has been
 * collected — the client rebuilds the whole level around the new deal.
 */
export function dealGems(session: Session, map: number, requestId: number): SelectedGem[] {
  session.map = map
  session.requestId = requestId
  session.gems = pickGems(map)
  session.collected = new Array<boolean>(session.gems.length).fill(false)
  session.startTime = 0
  return session.gems
}

/** Starts the run clock. Called when the player leaves the start gate. */
export function startRun(session: Session, map: number): void {
  session.map = map
  session.startTime = Date.now()
}

/** Discards the run in progress (fall, death, or leaving the runner). */
export function failRun(session: Session): void {
  session.startTime = 0
  session.collected = new Array<boolean>(session.gems.length).fill(false)
}

/**
 * Credits a gem pickup.
 *
 * Accepts only when the run still has an uncollected gem of that type and the
 * player is close enough to one of them. When the runtime has not reported a
 * position for the player yet the proximity test is skipped rather than failed,
 * so a slow-joining player is never punished for it.
 *
 * @returns true when the pickup was credited.
 */
export function collectGem(session: Session, gemType: number): boolean {
  if (session.gems.length === 0) return false

  const position = getPlayerPosition(session.address)

  let bestIndex = -1
  let bestDistance = Number.MAX_VALUE

  for (let i = 0; i < session.gems.length; i++) {
    if (session.collected[i]) continue
    const gem = session.gems[i]
    if (gem.gemType !== gemType) continue

    if (!position) {
      bestIndex = i
      break
    }

    const world = Vector3.add(Vector3.create(gem.x, gem.y, gem.z), GAME_AREA_ORIGIN)
    const distance = Vector3.distance(position, world)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }

  if (bestIndex < 0) {
    console.log('[SERVER] collectGem rejected: no uncollected gem of type', gemType, 'for', session.address)
    return false
  }

  if (position && bestDistance > GEM_PICKUP_RADIUS) {
    console.log(
      '[SERVER] collectGem rejected (antiCheat): nearest type',
      gemType,
      'gem is',
      Math.round(bestDistance),
      'm from',
      session.address
    )
    return false
  }

  session.collected[bestIndex] = true
  return true
}

/** How many gems of the run have been collected so far. */
export function collectedCount(session: Session): number {
  let total = 0
  for (const collected of session.collected) if (collected) total++
  return total
}

/** Collected gems broken down by type (1..4). */
export function collectedByType(session: Session): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (let i = 0; i < session.gems.length; i++) {
    if (session.collected[i]) counts[session.gems[i].gemType] = (counts[session.gems[i].gemType] ?? 0) + 1
  }
  return counts
}

/** Whether the run may be finished: every gem of the deal has been collected. */
export function runIsComplete(session: Session): boolean {
  return session.gems.length >= TOTAL_GEMS && collectedCount(session) >= session.gems.length
}

/** Applies a hit's damage. Returns the new health, or undefined for an unknown source. */
export function applyDamage(session: Session, source: string): number | undefined {
  const amount = DAMAGE[source]
  if (amount === undefined) return undefined

  session.health = Math.max(0, session.health - amount)
  if (session.health <= 0) {
    // Out of health: the run failed, discard its progress.
    failRun(session)
  }
  return session.health
}

/** Back to full health (lobby entry, runner entry, level reset). */
export function resetHealth(session: Session): number {
  session.health = session.healthLevel
  return session.health
}
