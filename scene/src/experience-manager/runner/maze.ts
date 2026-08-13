import { engine, Entity, GltfContainer, ColliderLayer, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

/**
Maze Experiment
 */

// ─── Direction system: N=+Z, E=+X, S=-Z, W=-X ────────────────────────────────
type Dir = 0 | 1 | 2 | 3
const N: Dir = 0, E: Dir = 1, S: Dir = 2, W: Dir = 3
const ALL_DIRS: Dir[] = [N, E, S, W]
const OPP: Dir[] = [S, W, N, E]
const DX = [0, 1, 0, -1]
const DZ = [1, 0, -1, 0]
const rotDir = (d: Dir, r: number): Dir => ((((d + r) % 4) + 4) % 4) as Dir

/** World-space size of one grid cell: the tiles' shared 18m cell design. The
 * distance between the map-defined start and end must be a multiple of this. */
const CELL = 18

/** Length of one straight/end lane segment; three of them span a cell. */
const SEGMENT = 6

const MODEL_END = 'models/tile-end.glb'
const MODEL_STRAIGHT = 'models/tile-straight.glb'
const MODEL_TURN = 'models/tile-turn.glb'
const MODEL_FORK = 'models/tile-fork.glb'
const MODEL_CROSS = 'models/tile-cross.glb'

/** One GLB placed inside a cell: its model, offset from the cell centre (in the
 * cell's unrotated frame) and its own extra rotation in 90° steps. */
type SubPiece = { model: string; dx: number; dz: number; rot: number }

/**
 * Cell catalog. `openings` are the sides open in the cell's unrotated form;
 * `pieces` are the GLBs that build it. Every piece is placed at its authored
 * scale — long corridors are made of more segments, never stretched ones.
 */
const TILES: Record<string, { openings: Dir[]; pieces: SubPiece[] }> = {
  // Dead end: capped segment at the east edge, then two straights running west.
  end: {
    openings: [W],
    pieces: [
      { model: MODEL_END, dx: SEGMENT, dz: 0, rot: 0 },
      { model: MODEL_STRAIGHT, dx: 0, dz: 0, rot: 0 },
      { model: MODEL_STRAIGHT, dx: -SEGMENT, dz: 0, rot: 0 }
    ]
  },
  // Through corridor: three segments end to end across the cell.
  straight: {
    openings: [E, W],
    pieces: [
      { model: MODEL_STRAIGHT, dx: -SEGMENT, dz: 0, rot: 0 },
      { model: MODEL_STRAIGHT, dx: 0, dz: 0, rot: 0 },
      { model: MODEL_STRAIGHT, dx: SEGMENT, dz: 0, rot: 0 }
    ]
  },
  // Junction pieces: single GLBs, offset so the junction sits on the cell centre.
  turn: { openings: [S, W], pieces: [{ model: MODEL_TURN, dx: -2, dz: -2, rot: 0 }] },
  fork: { openings: [E, W, S], pieces: [{ model: MODEL_FORK, dx: 0, dz: -2, rot: 0 }] },
  cross: { openings: [N, E, S, W], pieces: [{ model: MODEL_CROSS, dx: 0, dz: 0, rot: 0 }] }
}
const TYPES = Object.keys(TILES)

/** Models whose floor slab overhangs the cell edge by a few cm; dropped a hair
 * so the overlap with the neighbour's slab doesn't z-fight. */
const OVERHANG_NUDGE_MODELS = [MODEL_TURN, MODEL_FORK]
const OVERHANG_NUDGE = -0.002

/** How many rows (Z) the maze band spans, centred on the start/end row. Odd, so
 * the start/end row sits exactly in the middle. */
const MAZE_ROWS = 3

/** Growing-tree selection bias: probability of expanding the NEWEST frontier
 * cell (DFS-like long corridors) vs. a RANDOM one (Prim-like — sprouts lots of
 * short dead-end branches). Lower = more dead ends. */
const NEWEST_BIAS = 0.35

/** Rotates a local XZ vector by r * 90° (matches a yaw of r*90 in DCL, where
 * +90° takes +Z to +X). */
function rotVec(x: number, z: number, r: number): [number, number] {
  let vx = x, vz = z
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) {
    const nx = vz, nz = -vx
    vx = nx; vz = nz
  }
  return [vx, vz]
}

/** Finds the cell type + rotation whose opening set matches exactly. */
function tileFor(openings: Set<Dir>): { type: string; r: number } {
  for (const type of TYPES) {
    for (let r = 0; r < 4; r++) {
      const rotated = TILES[type].openings.map((d) => rotDir(d, r))
      if (rotated.length === openings.size && rotated.every((d) => openings.has(d))) {
        return { type, r }
      }
    }
  }
  // Unreachable: every non-empty subset of 4 directions matches one of the 5
  // shapes at some rotation. Fall back to a cross so a bug stays visible.
  return { type: 'cross', r: 0 }
}

/**
 * Builds a random maze between `start` and `end` (map-local positions, same y).
 *
 * The grid spans the X range from start to end (inclusive) and MAZE_ROWS rows in
 * Z centred on them. A spanning tree is carved over the whole grid, then the
 * start cell gets an extra opening facing outward (toward the map's start gate)
 * and the end cell one facing the opposite way — the maze's entrance and exit.
 * Every cell is reachable, so a route start->end always exists; all other
 * branches dead-end.
 *
 * If the start/end distance doesn't divide into whole cells the grid is snapped
 * (with a console warning) — define positions CELL apart to avoid misalignment.
 *
 * @param parent Game-area root; the whole maze tears down with it.
 */
export function createMaze(parent: Entity, start: Vector3, end: Vector3): void {
  // ── Grid layout from the two anchors ──
  const spanX = Math.abs(start.x - end.x)
  const cols = Math.max(2, Math.round(spanX / CELL) + 1)
  const snappedSpan = (cols - 1) * CELL
  if (Math.abs(snappedSpan - spanX) > 0.001) {
    console.log(
      `[maze] start->end span ${spanX}m is not a multiple of ${CELL}m — ` +
        `snapping to ${snappedSpan}m. Adjust the map definition for exact placement.`
    )
  }
  if (Math.abs(start.z - end.z) > 0.001) {
    console.log('[maze] start/end z differ — using start.z for the maze row')
  }

  // Column 0 = the start side; columns advance toward the end side.
  const xDirSign = end.x > start.x ? 1 : -1
  const colX = (c: number) => start.x + xDirSign * c * CELL
  const halfRows = Math.floor(MAZE_ROWS / 2)
  const rowZ = (rw: number) => start.z + (rw - halfRows) * CELL

  const rows = MAZE_ROWS
  const startCell = { c: 0, rw: halfRows }
  const endCell = { c: cols - 1, rw: halfRows }

  // ── Carve a spanning tree (growing-tree, Prim-biased for many dead ends) ──
  const openings: Set<Dir>[][] = []
  for (let c = 0; c < cols; c++) {
    openings.push([])
    for (let rw = 0; rw < rows; rw++) openings[c].push(new Set<Dir>())
  }

  // Grid direction helpers: E/W move along columns (X axis), N/S along rows (Z).
  const stepCell = (c: number, rw: number, d: Dir) => ({
    c: c + DX[d] * xDirSign,
    rw: rw + DZ[d]
  })
  const inGrid = (c: number, rw: number) => c >= 0 && c < cols && rw >= 0 && rw < rows

  const visited: boolean[][] = openings.map((col) => col.map(() => false))
  visited[startCell.c][startCell.rw] = true
  const active: { c: number; rw: number }[] = [startCell]

  while (active.length > 0) {
    const idx = Math.random() < NEWEST_BIAS ? active.length - 1 : Math.floor(Math.random() * active.length)
    const cell = active[idx]

    const unvisited: Dir[] = []
    for (const d of ALL_DIRS) {
      const nb = stepCell(cell.c, cell.rw, d)
      if (inGrid(nb.c, nb.rw) && !visited[nb.c][nb.rw]) unvisited.push(d)
    }

    if (unvisited.length === 0) {
      active.splice(idx, 1)
      continue
    }

    const d = unvisited[Math.floor(Math.random() * unvisited.length)]
    const nb = stepCell(cell.c, cell.rw, d)
    openings[cell.c][cell.rw].add(d)
    openings[nb.c][nb.rw].add(OPP[d])
    visited[nb.c][nb.rw] = true
    active.push(nb)
  }

  // ── Entrance and exit: openings facing off-grid toward the runways ──
  const towardStartGate: Dir = xDirSign === 1 ? W : E // outward from column 0
  openings[startCell.c][startCell.rw].add(towardStartGate)
  openings[endCell.c][endCell.rw].add(OPP[towardStartGate])

  // ── Spawn each cell's pieces ──
  let tileCount = 0
  for (let c = 0; c < cols; c++) {
    for (let rw = 0; rw < rows; rw++) {
      const { type, r } = tileFor(openings[c][rw])
      const cx = colX(c)
      const cz = rowZ(rw)
      for (const piece of TILES[type].pieces) {
        // The piece offset is authored in the cell's unrotated frame, so rotate
        // it with the cell to keep every segment on the corridor axis.
        const [ox, oz] = rotVec(piece.dx, piece.dz, r)
        const yNudge = OVERHANG_NUDGE_MODELS.indexOf(piece.model) >= 0 ? OVERHANG_NUDGE : 0
        const tile = engine.addEntity()
        Transform.create(tile, {
          position: Vector3.create(cx + ox, start.y + yNudge, cz + oz),
          rotation: Quaternion.fromEulerDegrees(0, ((r + piece.rot) % 4) * 90, 0),
          parent
        })
        GltfContainer.create(tile, {
          src: piece.model,
          visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS
        })
        tileCount++
      }
    }
  }

  console.log(`[maze] built ${cols}x${rows} maze (${tileCount} tiles, cell ${CELL}m)`)
}
