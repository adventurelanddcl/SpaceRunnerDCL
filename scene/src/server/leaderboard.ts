/**
 * Per-map speed-run leaderboard. Server-only.
 */
import { Storage } from '@dcl/sdk/server'
import { MAP_COUNT } from './profiles'

/** One player's best run of a map. */
export type BoardEntry = {
  address: string
  name: string
  /** Total run duration in milliseconds. */
  totalMs: number
}

/** Rows kept in Storage per map — more than the board shows, so a record being
 * beaten doesn't permanently drop the runner-up off the board. */
const MAX_STORED = 25

/** Rows sent to the scene (the board has 10 pre-built rows). */
export const BOARD_LIMIT = 10

function storageKey(map: number): string {
  return `lb:${map}`
}

const boards = new Map<number, BoardEntry[]>()
const dirty = new Set<number>()
const loading = new Map<number, Promise<BoardEntry[]>>()

function normalize(raw: unknown): BoardEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => e && typeof e === 'object')
    .map((e: any) => ({
      address: String(e.address ?? ''),
      name: String(e.name ?? ''),
      totalMs: Number(e.totalMs) || 0
    }))
    .filter((e) => e.totalMs > 0)
    .sort((a, b) => a.totalMs - b.totalMs)
    .slice(0, MAX_STORED)
}

/** Loads (once) and returns a map's board, fastest first. */
export async function getBoard(map: number): Promise<BoardEntry[]> {
  const cached = boards.get(map)
  if (cached) return cached

  const inFlight = loading.get(map)
  if (inFlight) return await inFlight

  const load = (async () => {
    let raw: unknown = null
    try {
      raw = await Storage.get(storageKey(map))
    } catch (err) {
      console.log('[SERVER] leaderboard read failed for map', map, err)
    }
    const board = normalize(raw)
    boards.set(map, board)
    loading.delete(map)
    return board
  })()

  loading.set(map, load)
  return await load
}

/**
 * Folds a finished run into a map's board, keeping only the player's own best.
 *
 * @returns true when the board changed (and therefore needs re-broadcasting).
 */
export async function recordRun(
  map: number,
  address: string,
  name: string,
  totalMs: number
): Promise<boolean> {
  if (totalMs <= 0) return false

  const board = await getBoard(map)
  const key = address.toLowerCase()
  const existing = board.find((e) => e.address.toLowerCase() === key)

  if (existing) {
    // Always refresh the stored display name; only the time is a record.
    const renamed = existing.name !== name
    if (existing.totalMs <= totalMs) {
      if (!renamed) return false
      existing.name = name
      dirty.add(map)
      return true
    }
    existing.name = name
    existing.totalMs = totalMs
  } else {
    board.push({ address: key, name, totalMs })
  }

  board.sort((a, b) => a.totalMs - b.totalMs)
  if (board.length > MAX_STORED) board.length = MAX_STORED
  dirty.add(map)
  return true
}

/** The rows the scene renders: top `BOARD_LIMIT`, in message shape. */
export function toMessageEntries(map: number): {
  name: string
  address: string
  totalSeconds: number
  milliseconds: number
}[] {
  const board = boards.get(map) ?? []
  return board.slice(0, BOARD_LIMIT).map((e) => ({
    name: e.name,
    address: e.address,
    totalSeconds: Math.floor(e.totalMs / 1000),
    milliseconds: e.totalMs % 1000
  }))
}

/** Persists every changed board; a failed write is retried. */
export async function flushBoards(): Promise<void> {
  if (dirty.size === 0) return
  for (const map of [...dirty]) {
    const board = boards.get(map)
    if (!board) {
      dirty.delete(map)
      continue
    }
    try {
      const ok = await Storage.set(storageKey(map), board)
      if (ok) dirty.delete(map)
      else console.log('[SERVER] leaderboard write did not persist for map', map)
    } catch (err) {
      console.log('[SERVER] leaderboard write failed for map', map, err)
    }
  }
}

/** Warms the caches so the first `requestLeaderboard` answers immediately. */
export async function preloadBoards(): Promise<void> {
  for (let map = 1; map <= MAP_COUNT; map++) {
    await getBoard(map)
  }
}
