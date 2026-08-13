import { TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { SpawningPlatformUPConfig } from '../spawningPlatformUP'
import { MeteorConfig } from '../meteor'
import { EnemyConfig } from '../enemy'
import { SpikePlateConfig } from '../spikePlate'

export interface BallTrap {
  transform?: TransformTypeWithOptionals
  path: Vector3[]
  // Travel speed in units per second (constant across all segments).
  speed?: number
}

export interface LaserWall {
  // Static wall: set position. Moving wall: set path (and optional speed).
  position?: Vector3
  path?: Vector3[]
  // Travel speed in units per second (constant across all segments).
  speed?: number
  rotation?: Quaternion
}

export interface SpikeBeam {
  /** Looped waypoints the beam patrols, in the game area's local space. */
  path: Vector3[]
  /** Orientation of the beam; its long axis, trigger box and spin axis all turn
   * with it (unrotated the bar lies along X). */
  rotation?: Quaternion
  /** Travel speed in units per second (constant across all segments). */
  speed?: number
}

export interface MovingPlatform {
  // One-time lead-in path; the platform starts stationary at introPath[0].
  introPath: Vector3[]
  // Path looped indefinitely after the intro.
  loopPath: Vector3[]
  // Travel speed in units per second (kept constant across all segments).
  speed?: number
}

export interface GameMap {
  modelPath: string
  /** Position of the map model relative to the game area root (default (0,0,0)). */
  modelPosition?: Vector3
  /** Position of the fall-detection trigger relative to the game area root
   * (default: centred below the map — see createFallTrigger). */
  fallTriggerPosition?: Vector3
  /** Where the player is teleported when this map is entered / respawned. */
  spawnPosition: Vector3
  /** Where the camera looks after the spawn teleport (default: scene centre). */
  spawnCameraTarget?: Vector3
  /** Where the avatar faces after the spawn teleport (default: scene centre). */
  spawnAvatarTarget?: Vector3
  startPosition: Vector3
  startSize: Vector3
  finishPosition: Vector3
  finishSize: Vector3
  ballTraps?: BallTrap[]
  laserWalls?: LaserWall[]
  laserMazeWalls?: { position: Vector3; length?: number; rotation?: Quaternion }[]
  /** Vertical laser mazes: a row of vertical red beams that sweep a `path` back and
   * forth; touching one deals laser-wall damage. `height` sets the beam height,
   * `speed` the travel speed, and `rotation` orients the whole formation (all
   * optional). */
  laserMazeVerticals?: { path: Vector3[]; height?: number; speed?: number; rotation?: Quaternion }[]
  swingBeams?: TransformTypeWithOptionals[]
  /** Spinning spiked bars that patrol a path; contact throws the player and
   * costs 5 health. */
  spikeBeams?: SpikeBeam[]
  /** Patrolling plates whose spikes periodically stab out. Only dangerous while
   * the spikes are up — the damage volume retracts under the plate between
   * extensions, so a dormant plate is safe to stand on. */
  spikePlates?: SpikePlateConfig[]
  bounceTraps?: TransformTypeWithOptionals[]
  bounceStands?: TransformTypeWithOptionals[]
  /** Rotation-aimed bounces: launch the player along the entity's own orientation
   * (up + local +Z turned by `rotation`), not relative to the player's facing. */
  bounceV2s?: TransformTypeWithOptionals[]
  /** Ascending spawning-platform towers (one or more per map). Per tower:
   * `showPointerArrow` floats a guide arrow above the first platform until the
   * player steps on it; `maxBlockHeight` sets the Y the tower climbs to;
   * `maxDistance` sets the max horizontal step between platforms; `boundary` sets
   * the half-extent of the play area around the start (all default to the tower's
   * built-in values). */
  spawningPlatformUPs?: SpawningPlatformUPConfig[]
  collapsingPlatforms?: TransformTypeWithOptionals[]
  movingPlatforms?: MovingPlatform[]
  floatingPlatforms?: TransformTypeWithOptionals[]
  /** Stepping-stone path: only `start` is visible at build; stepping on a platform
   * spawns every unspawned platform within `spawnRadius` (splits appear together). */
  spawningPlatformPaths?: {
    start: TransformTypeWithOptionals[]
    platforms: TransformTypeWithOptionals[]
    spawnRadius?: number
  }
  /** Rings that launch the player straight up when stepped into. */
  boostRings?: TransformTypeWithOptionals[]
  /** Groups of candidate boost-ring placements. On each map build, one ring per
   * group is randomly picked for every y level the group has candidates at. */
  boostRingGroups?: TransformTypeWithOptionals[][]
  /** Exploding mines with a scene-spanning laser; rotation aims the laser (+Z). */
  gliderMines?: TransformTypeWithOptionals[]
  /** Wind columns that push the player along their orientation (up when unrotated).
   * Per column, `triggerHeight` sets how tall the wind-affect volume is — taller
   * carries the player higher/further; omit for the default height. */
  windForces?: (TransformTypeWithOptionals & { triggerHeight?: number })[]
  /** Enemies patrolling a defined area. Entering an enemy's awareness zone makes
   * it lock onto that spot and ram it after a short wind-up (so it can be
   * dodged); contact knocks the player back and costs 5 health. */
  enemies?: EnemyConfig[]
  /** Periodic meteor strikes inside a defined area: each meteor is telegraphed by
   * an orange ring + beam, stops on the first collider in its path, explodes on
   * impact, and deals 5 damage to a player caught in the ring. */
  meteors?: MeteorConfig[]
  /** Wind columns that throw the player in a single burst (boost-ring style)
   * rather than pushing continuously. Per column, `strength` sets the impulse
   * magnitude — omit for the default. Multiple can be placed per map. */
  windForceV2s?: (TransformTypeWithOptionals & { strength?: number })[]
  windForceV3s?: (TransformTypeWithOptionals & { strength?: number })[]
  /** Random maze between `start` (entrance, faces the start gate) and `end`
   * (exit): a fresh dead-end-rich layout is generated on every map build. The
   * start->end distance must be a multiple of the maze cell size (see maze.ts). */
  maze?: { start: Vector3; end: Vector3 }
}
