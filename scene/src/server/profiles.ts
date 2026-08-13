/**
 * Per-player persistent data. Server-only.
 */
import { Storage } from '@dcl/sdk/server'

/** How many maps the runner has. Index 0 = map1. */
export const MAP_COUNT = 10

/** Storage key, inside the player's own namespace. */
const PROFILE_KEY = 'profile'

/** Default max health. */
const DEFAULT_HEALTH_LEVEL = 10

export type Profile = {
  name: string
  coins: number
  healthLevel: number
  healthXP: number
  gem1: number
  gem2: number
  gem3: number
  gem4: number
  runTotal: number
  maps: boolean[]
}

const cache = new Map<string, Profile>()
const dirty = new Set<string>()
/** In-flight loads, so two messages arriving in the same tick share one read. */
const loading = new Map<string, Promise<Profile>>()

function defaultMaps(): boolean[] {
  const maps = new Array<boolean>(MAP_COUNT).fill(false)
  maps[0] = true
  return maps
}

function defaultProfile(name: string): Profile {
  return {
    name,
    coins: 0,
    healthLevel: DEFAULT_HEALTH_LEVEL,
    healthXP: 0,
    gem1: 0,
    gem2: 0,
    gem3: 0,
    gem4: 0,
    runTotal: 0,
    maps: defaultMaps()
  }
}

/**
 * Coerces whatever came out of Storage into a complete Profile. Storage holds
 * data written by older versions of this scene, so every field is back-filled
 * rather than trusted.
 */
function normalize(raw: Partial<Profile> | null, name: string): Profile {
  const base = defaultProfile(name)
  if (!raw) return base

  const maps = base.maps
  if (Array.isArray(raw.maps)) {
    for (let i = 0; i < MAP_COUNT; i++) maps[i] = i === 0 ? true : !!raw.maps[i]
  }

  return {
    name: raw.name || name,
    coins: Number(raw.coins) || 0,
    healthLevel: Number(raw.healthLevel) || DEFAULT_HEALTH_LEVEL,
    healthXP: Number(raw.healthXP) || 0,
    gem1: Number(raw.gem1) || 0,
    gem2: Number(raw.gem2) || 0,
    gem3: Number(raw.gem3) || 0,
    gem4: Number(raw.gem4) || 0,
    runTotal: Number(raw.runTotal) || 0,
    maps
  }
}

/**
 * Loads a player's profile, creating (but not yet persisting) a fresh one for a
 * player that has never played. Subsequent calls are served from memory.
 */
export async function loadProfile(address: string, displayName: string): Promise<Profile> {
  const key = address.toLowerCase()

  const cached = cache.get(key)
  if (cached) {
    // A returning player may have renamed themselves since the last session.
    if (displayName && cached.name !== displayName) {
      cached.name = displayName
      dirty.add(key)
    }
    return cached
  }

  const inFlight = loading.get(key)
  if (inFlight) return await inFlight

  const load = (async () => {
    let raw: Partial<Profile> | null = null
    try {
      raw = await Storage.player.get<Partial<Profile>>(key, PROFILE_KEY)
    } catch (err) {
      console.log('[SERVER] profile read failed for', key, err)
    }
    const profile = normalize(raw, displayName || 'Anonymous')
    cache.set(key, profile)
    // A brand-new player is written out immediately so their row exists even if
    // they never finish a run — this mirrors the old server's upsert on join.
    if (!raw) dirty.add(key)
    loading.delete(key)
    return profile
  })()

  loading.set(key, load)
  return await load
}

/** The in-memory profile, or undefined when the player has not joined yet. */
export function getProfile(address: string): Profile | undefined {
  return cache.get(address.toLowerCase())
}

/** Marks a profile for the next Storage flush. */
export function markProfileDirty(address: string): void {
  dirty.add(address.toLowerCase())
}

/**
 * Persists every pending profile. `set` resolves `false` when the write did not
 * land (e.g. the host-call cap was hit), so the key stays dirty and is retried
 * on the next flush instead of being silently lost.
 */
export async function flushProfiles(): Promise<void> {
  if (dirty.size === 0) return
  for (const key of [...dirty]) {
    const profile = cache.get(key)
    if (!profile) {
      dirty.delete(key)
      continue
    }
    try {
      const ok = await Storage.player.set(key, PROFILE_KEY, profile)
      if (ok) dirty.delete(key)
      else console.log('[SERVER] profile write did not persist for', key)
    } catch (err) {
      console.log('[SERVER] profile write failed for', key, err)
    }
  }
}

/**
 * Drops a disconnected player's cached profile after flushing it. Keeping every
 * player who ever visited in memory would grow without bound (the isolate has a
 * 256 MB ceiling).
 */
export async function releaseProfile(address: string): Promise<void> {
  const key = address.toLowerCase()
  if (dirty.has(key)) await flushProfiles()
  cache.delete(key)
}
