import {
  engine,
  Entity,
  MeshRenderer,
  Material,
  Transform,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color3, Color4 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitLaserWall } from '../../client/connection'

/**
 * Beam thickness (m). Deliberately thinner than the glider mine's laser (0.2) so
 * the maze reads as a fine security beam rather than a fat one.
 */
const BEAM_THICKNESS = 0.07

/** One-shot sound played when the player trips a beam (shared with laser walls). */
const LASER_HIT_SOUND = 'sounds/laserHit.mp3'

/** One beam, by its two endpoints in the maze's local space. */
type LaserBeam = { from: Vector3; to: Vector3 }

/**
 * The two beam shapes, each a diagonal 3m wide (z) and 6m tall (y) crossing the
 * maze's local origin. "/" beams scroll one way along the wall, "\" beams the
 * other — as they pass they form the crossing X. Maps only pick where the wall
 * goes and how long it is, never the beam geometry.
 */
const BEAM_SLASH: LaserBeam = { from: Vector3.create(0, -3, -1.5), to: Vector3.create(0, 3, 1.5) } // /
const BEAM_BACKSLASH: LaserBeam = { from: Vector3.create(0, 3, -1.5), to: Vector3.create(0, -3, 1.5) } // \

/** Axis the beams scroll along: local Z, i.e. the direction the wall extends and
 * the beams travel (across the corridor for a wall facing down it). */
const TRAVEL_AXIS = Vector3.create(0, 0, 1)

/** Wall span (m) added per unit of `length`, and the spacing between consecutive
 * same-direction beams (they're one beam-width apart, so they tile). */
const SEGMENT_LENGTH = 3

/** Speed (m/s) each beam scrolls along TRAVEL_AXIS. */
const TRAVEL_SPEED = 1

/**
 * Creates a laser maze: a wall of glowing-red diagonal beams

 * @param transform Where the wall's centre sits (position/parent) and any rotation
 *   orienting the whole wall (beams + scroll direction). Beam geometry is fixed.
 * @param length How long the wall is / how many beams per direction (default 1).
 * @returns The maze root entity (beams are parented to it, so removing it — or the
 *   game area — tears the whole wall down).
 */
export function createLaserMazeWall(transform: TransformTypeWithOptionals, length: number = 1): Entity {
  const count = Math.max(1, Math.floor(length))
  const span = count * SEGMENT_LENGTH

  const root = engine.addEntity()
  Transform.create(root, { ...transform })

  // `count` "/" beams scrolling one way, `count` "\" beams scrolling the other,
  // each offset by SEGMENT_LENGTH so they tile evenly across the wall span.
  for (let i = 0; i < count; i++) {
    const phase = i * SEGMENT_LENGTH
    addScrollingBeam(root, BEAM_SLASH, 1, phase, span)
    addScrollingBeam(root, BEAM_BACKSLASH, -1, phase, span)
  }

  return root
}

/** Adds one beam on its own pivot and starts it scrolling along the wall. */
function addScrollingBeam(
  root: Entity,
  shape: LaserBeam,
  direction: number,
  phase: number,
  span: number
): void {
  const pivot = engine.addEntity()
  Transform.create(pivot, { parent: root })
  createBeam(pivot, shape)
  startScroll(pivot, direction, phase, span)
}

/**
 * Scrolls a beam pivot along TRAVEL_AXIS forever, wrapping over `span` so the beam
 * that leaves one end re-enters the other — a continuous loop. `direction` (+1/-1)
 * sets which way it scrolls; `phase` staggers the beams so they're evenly spaced.
 */
function startScroll(pivot: Entity, direction: number, phase: number, span: number): void {
  const axis = Vector3.normalize(TRAVEL_AXIS)
  let elapsed = 0
  const systemName = `laser-maze-scroll-${pivot}`
  engine.addSystem(
    (dt) => {
      const t = Transform.getMutableOrNull(pivot)
      if (t === null) {
        engine.removeSystem(systemName) // maze / level torn down
        return
      }
      elapsed += dt
      // Position within [0, span), then centred to [-span/2, span/2).
      let x = (phase + direction * TRAVEL_SPEED * elapsed) % span
      if (x < 0) x += span
      t.position = Vector3.scale(axis, x - span / 2)
    },
    undefined,
    systemName
  )
}

/** Builds a single beam (visible box + damage trigger) between two local points. */
function createBeam(parent: Entity, beam: LaserBeam): void {
  const direction = Vector3.subtract(beam.to, beam.from)
  const length = Vector3.length(direction)
  if (length < 0.001) return // degenerate (from == to)

  const midpoint = Vector3.create(
    (beam.from.x + beam.to.x) / 2,
    (beam.from.y + beam.to.y) / 2,
    (beam.from.z + beam.to.z) / 2
  )

  // Orient local +Z from the midpoint toward `to` so a box scaled on Z spans the
  // beam. fromLookAt is singular when the beam is (near-)vertical, so pick a
  // non-parallel up vector in that case.
  const normalized = Vector3.normalize(direction)
  const up = Math.abs(normalized.y) > 0.99 ? Vector3.Forward() : Vector3.Up()
  const rotation = Quaternion.fromLookAt(midpoint, beam.to, up)

  const beamTransform: TransformTypeWithOptionals = {
    position: midpoint,
    rotation,
    scale: Vector3.create(BEAM_THICKNESS, BEAM_THICKNESS, length),
    parent
  }

  // Visible beam: thin glowing-red box (same material as the glider mine laser).
  const laser = engine.addEntity()
  Transform.create(laser, beamTransform)
  MeshRenderer.setBox(laser)
  Material.setPbrMaterial(laser, {
    albedoColor: Color4.Red(),
    emissiveColor: Color3.Red(),
    emissiveIntensity: 4
  })

  // Damage trigger matching the visible beam. Parented to the moving root, so the
  // volume tracks the beam as the X travels.
  createTrigger({ ...beamTransform }, () => {
    sendHitLaserWall()
    spawnDamageBurst()
    playOneShotOnPlayer(LASER_HIT_SOUND)
  })
}
