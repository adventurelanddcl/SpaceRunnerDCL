import {
  engine,
  Entity,
  MeshRenderer,
  Material,
  Transform,
  GltfContainer,
  Tween,
  TweenSequence,
  TweenLoop,
  EasingFunction,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Color3, Color4 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitLaserWall } from '../../client/connection'

/** Beam thickness (m), matching the laser-maze wall's thin beams. */
const BEAM_THICKNESS = 0.07

/** Decorative cap that sits on top of the beams and moves with the formation. */
const TOP_MODEL = 'models/laserMazeWallVerticalTop.glb'

/** One-shot sound played when the player trips a beam (shared with laser walls). */
const LASER_HIT_SOUND = 'sounds/laserHit.mp3'

/** How many vertical beams the formation has. */
const BEAM_COUNT = 5

/** Gap (m) between neighbouring beams, along SPACING_AXIS. */
const BEAM_SPACING = 1

/** Axis the beams are lined up along (local X, i.e. down the corridor by default),
 * perpendicular to the sweep so the formation reads as a row of vertical bars. */
const SPACING_AXIS = Vector3.create(1, 0, 0)

/** Default beam height (m) if a map doesn't specify one — same 6m as the wall. */
const DEFAULT_HEIGHT = 6

/** Default travel speed (units/second) if a map doesn't specify one. */
const DEFAULT_SPEED = 4

/**
 * Creates a vertical laser maze: a row of BEAM_COUNT vertical glowing-red beams,
 * spaced BEAM_SPACING apart, that patrols a map-defined path back and forth. Each
 * beam rises `height` metres from the path (floor) upward. Touching any beam deals
 * laser-wall damage (5, server-side) with a hit sound and damage burst, just like
 * the laser walls.
 *
 * The whole formation is one tweened root: the beams are parented to it (so they
 * keep their spacing) and their damage triggers ride along, tracking the motion.
 * The path is travelled forward then reversed), forever — a back-and-forth
 * sweep the player has to time.
 *
 * @param transform Parent and any rotation for the formation. The starting
 *   position is taken from `path[0]`; a `rotation` here orients the whole row of
 *   beams and is preserved as it sweeps (the Move tween only drives position).
 * @param path Waypoints the formation sweeps between, back and forth (local space).
 * @param height Beam height in metres (default DEFAULT_HEIGHT).
 * @param speed Travel speed in units/second, constant across segments (default
 *   DEFAULT_SPEED).
 * @returns The formation root entity (beams are parented to it, so removing it — or
 *   the game area — tears the whole formation down).
 */
export function createLaserMazeVertical(
  transform: TransformTypeWithOptionals,
  path: Vector3[],
  height: number = DEFAULT_HEIGHT,
  speed: number = DEFAULT_SPEED
): Entity {
  const start = path.length > 0 ? path[0] : Vector3.Zero()

  const root = engine.addEntity()
  Transform.create(root, { ...transform, position: start })

  // Lay the beams out in a row centred on the root, spaced along SPACING_AXIS.
  const axis = Vector3.normalize(SPACING_AXIS)
  const centreIndex = (BEAM_COUNT - 1) / 2
  for (let i = 0; i < BEAM_COUNT; i++) {
    const offset = (i - centreIndex) * BEAM_SPACING
    createVerticalBeam(root, Vector3.scale(axis, offset), height)
  }

  // Decorative cap at the top of the beams. Parented to the root, so it sweeps
  // (and rotates) with the formation. Sits at the beams' top (local y = height).
  const top = engine.addEntity()
  Transform.create(top, { position: Vector3.create(0, height, 0), parent: root })
  GltfContainer.create(top, { src: TOP_MODEL })

  startPatrol(root, path, speed)

  return root
}

/** Builds one vertical beam (box + damage trigger) rising from `base` by `height`. */
function createVerticalBeam(parent: Entity, base: Vector3, height: number): void {
  const beamTransform: TransformTypeWithOptionals = {
    // Centre the box vertically over the base so it spans base.y .. base.y + height.
    position: Vector3.create(base.x, base.y + height / 2, base.z),
    scale: Vector3.create(BEAM_THICKNESS, height, BEAM_THICKNESS),
    parent
  }

  // Visible beam: thin glowing-red box (same material as the wall's beams).
  const laser = engine.addEntity()
  Transform.create(laser, beamTransform)
  MeshRenderer.setBox(laser)
  Material.setPbrMaterial(laser, {
    albedoColor: Color4.Red(),
    emissiveColor: Color3.Red(),
    emissiveIntensity: 4
  })

  // Damage trigger matching the beam; parented to the moving root so it tracks it.
  createTrigger({ ...beamTransform }, () => {
    sendHitLaserWall()
    spawnDamageBurst()
    playOneShotOnPlayer(LASER_HIT_SOUND)
  })
}

/**
 * Tweens the formation along `path` and back, forever, at a constant
 * `speed`. Like the laser wall's patrol, the initial Tween plus the sequence make
 * up the full trip; TL_YOYO reverses the whole thing so it sweeps back and forth.
 */
function startPatrol(entity: Entity, path: Vector3[], speed: number): void {
  if (path.length < 2) return // single point (or none): a static formation

  Tween.create(entity, {
    mode: Tween.Mode.Move({ start: path[0], end: path[1] }),
    duration: segmentDuration(path[0], path[1], speed),
    easingFunction: EasingFunction.EF_LINEAR
  })

  const sequence = []
  for (let i = 1; i < path.length - 1; i++) {
    sequence.push({
      mode: Tween.Mode.Move({ start: path[i], end: path[i + 1] }),
      duration: segmentDuration(path[i], path[i + 1], speed),
      easingFunction: EasingFunction.EF_LINEAR
    })
  }
  TweenSequence.create(entity, { sequence, loop: TweenLoop.TL_YOYO })
}

/** Milliseconds to travel from `a` to `b` at `speed` units/second. */
function segmentDuration(a: Vector3, b: Vector3, speed: number): number {
  return Math.max(1, (Vector3.distance(a, b) / speed) * 1000)
}
