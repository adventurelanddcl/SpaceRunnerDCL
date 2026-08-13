/**
 * The whole client <-> server protocol, in one place.
 */
import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

/** One gem the server dealt for a run: scene-local position + type 1..4. */
const GemSchema = Schemas.Map({
  x: Schemas.Float,
  y: Schemas.Float,
  z: Schemas.Float,
  gemType: Schemas.Int
})

/** One row of a map's speed-run board (fastest run per player). */
const SpeedRunEntrySchema = Schemas.Map({
  name: Schemas.String,
  /** Wallet address — the lobby board uses it for the profile picture. */
  address: Schemas.String,
  totalSeconds: Schemas.Int,
  milliseconds: Schemas.Int
})

/**
 * What a client claims hit it. The server owns the damage table — the client
 * never sends an amount.
 */
export const HitSource = {
  BALL_TRAP: 'ballTrap',
  LASER_WALL: 'laserWall',
  SWING_BEAM: 'swingBeam',
  BOUNCE: 'bounce',
  GLIDER_MINE: 'gliderMine'
} as const

export type HitSourceKind = typeof HitSource[keyof typeof HitSource]

export const Messages = {
  // ---- client -> server -----------------------------------------------------

  /** Sent once the server is known to be alive; asks for this player's state. */
  join: Schemas.Map({ name: Schemas.String, isGuest: Schemas.Boolean }),
  /** "Something hurt me" — the server decides how much it hurt. */
  hit: Schemas.Map({ source: Schemas.String }),
  /** Back to full health (lobby entry, runner entry, level reset). */
  resetHealth: Schemas.Map({ nonce: Schemas.Int }),
  /** Deal the gems for a run. `requestId` is echoed so stale replies are dropped. */
  requestGems: Schemas.Map({ map: Schemas.Int, requestId: Schemas.Int }),
  /** Send me the top 10 of this map. */
  requestLeaderboard: Schemas.Map({ map: Schemas.Int }),
  /** "I picked up a gem of this type" — validated against the dealt gems. */
  collectGem: Schemas.Map({ gemType: Schemas.Int }),
  /** The player left the start gate; the run clock starts server-side. */
  startRun: Schemas.Map({ map: Schemas.Int }),
  /** The player reached the finish. */
  finishRun: Schemas.Map({ nonce: Schemas.Int }),
  /** The player fell / died; the run is discarded. */
  failedRun: Schemas.Map({ nonce: Schemas.Int }),

  // ---- server -> client -----------------------------------------------------

  /**
   * "I am here" — broadcast on a fixed interval. This is how a client knows the
   * headless server is actually running: the room being connected only means
   * comms works, and a scene with no visitors has no server at all until one
   * cold-starts (~15 s in production).
   *
   * It is deliberately a *message* rather than a synced component. A component
   * would put CRDT state delivery and `Schemas.Int64` (which decodes through
   * `DataView.getBigInt64`) on the critical path, so liveness could read "dead"
   * on a runtime where messages were flowing perfectly well. `seq` only has to
   * change; nothing reads its value.
   */
  serverPulse: Schemas.Map({ seq: Schemas.Int }),

  health: Schemas.Map({ health: Schemas.Int, healthLevel: Schemas.Int }),
  resources: Schemas.Map({
    gem1: Schemas.Int,
    gem2: Schemas.Int,
    gem3: Schemas.Int,
    gem4: Schemas.Int
  }),
  /** Unlocked flags, index 0 = map1. */
  maps: Schemas.Map({ unlocked: Schemas.Array(Schemas.Boolean) }),
  gems: Schemas.Map({ requestId: Schemas.Int, gems: Schemas.Array(GemSchema) }),
  runFinished: Schemas.Map({
    minutes: Schemas.Int,
    seconds: Schemas.Int,
    milliseconds: Schemas.Int
  }),
  /** A map's top 10. Broadcast on change; also sent on request. */
  leaderboard: Schemas.Map({ map: Schemas.Int, entries: Schemas.Array(SpeedRunEntrySchema) })
}

export const room = registerMessages(Messages)
