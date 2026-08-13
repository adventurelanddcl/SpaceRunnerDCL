import {
  engine,
  GltfContainer,
  MeshRenderer,
  Material,
  Transform,
  removeEntityWithChildren,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color3, Color4 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { attachLoopingSound, playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { SCENE_SIZE } from '../../config'
import { sendHitGliderMine } from '../../client/connection'

/** Model used for the glider mine (a ~2x2x2 box cluster). */
const MODEL = 'models/gliderMine.glb'

/** Explosion sound played when the player sets the mine body off. */
const EXPLOSION_SOUND = 'sounds/ballHit.mp3'

/** One-shot sound played when the player touches the laser beam (same as laser walls). */
const LASER_HIT_SOUND = 'sounds/laserHit.mp3'

/** Continuous hum attached to the mine and its beam (same as the laser walls). */
const LASER_SOUND = 'sounds/laserWall.mp3'

/** Laser beam thickness (m). The visible beam and its damage trigger match. */
const LASER_THICKNESS = 0.2

/** Half-extent of the mine model; the laser starts at this surface offset. */
const MINE_HALF = 1

/** Trigger box around the mine body; touching it sets the mine off. */
const MINE_TRIGGER: TransformTypeWithOptionals = {
  scale: Vector3.create(2.6, 2.6, 2.6),
  position: Vector3.create(0, 0, 0)
}

/** Orbit speed around the map's central axis, in degrees per second. */
const ORBIT_SPEED = 5

/** Cone half-angle (degrees): how far the laser leans off the inward direction. */
const CONE_ANGLE = 25

/** Cone precession speed (degrees per second): how fast the leaning laser sweeps
 * around the inward direction, tracing the cone. */
const CONE_SPEED = 10

/**
 * Creates a glider mine: an orbiting trap with a scene-spanning laser.
 *
 * - The mine circles the map's central axis (x=0, z=0) forever at a fixed height:
 *   the map-defined position sets the orbit radius, start angle and y, which never
 *   changes. Movement is a per-frame Transform update, so the damage triggers (and
 *   the laser) track it on every platform.
 * - The laser points inward at the centre, but the mine leans `CONE_ANGLE` off that
 *   axis and precesses, so the beam continuously sweeps a cone around the inward
 *   direction as the mine travels.
 * - Touching the mine body explodes it (5 damage, server-side); the mine and its
 *   laser are removed until the level is rebuilt.
 * - Touching the beam deals 5 damage per entry. The beam is built in code (thin
 *   emissive box + matching trigger) rather than baked into the GLB, so its length
 *   always spans the scene and the damage volume exactly matches the visual.
 * - Both the mine body and the beam carry the looping laser hum (laserWall.mp3),
 *   so the player hears the threat approaching.
 *
 * @param transform Base transform (position/parent/scale). Any map-defined rotation
 *   is overridden by the orbit's inward-facing cone sweep.
 */
export function createGliderMine(transform: TransformTypeWithOptionals) {
  const mine = engine.addEntity()
  Transform.create(mine, { ...transform })
  GltfContainer.create(mine, { src: MODEL })
  // Spatial laser hum on the mine body; follows it around the orbit.
  attachLoopingSound(mine, LASER_SOUND)

  // Laser: thin box from the mine's +Z face spanning the scene, glowing red.
  // Parented to the mine, so the mine's rotation aims it and the explosion
  // removes it together with the body.
  const laserTransform: TransformTypeWithOptionals = {
    scale: Vector3.create(LASER_THICKNESS, LASER_THICKNESS, SCENE_SIZE),
    position: Vector3.create(0, 0, MINE_HALF + SCENE_SIZE / 2),
    parent: mine
  }
  const laser = engine.addEntity()
  Transform.create(laser, laserTransform)
  MeshRenderer.setBox(laser)
  Material.setPbrMaterial(laser, {
    albedoColor: Color4.Red(),
    emissiveColor: Color3.Red(),
    emissiveIntensity: 4
  })
  // Hum on the beam too (its audio source sits at the beam's centre, so the far
  // end of the laser is audible even when the mine itself is distant).
  attachLoopingSound(laser, LASER_SOUND)

  // Laser damage: 5 per entry, repeatable (mirrors how laser walls damage on enter).
  createTrigger({ ...laserTransform }, () => {
    sendHitGliderMine()
    spawnDamageBurst()
    playOneShotOnPlayer(LASER_HIT_SOUND)
  })

  // Mine contact: 5 damage and the mine explodes — gone (with its laser) until the
  // level is rebuilt. triggerOnce guards against double-firing on the same contact.
  createTrigger({ ...MINE_TRIGGER, parent: mine }, () => {
    sendHitGliderMine()
    spawnDamageBurst()
    playOneShotOnPlayer(EXPLOSION_SOUND)
    removeEntityWithChildren(engine, mine)
  }, true)

  startOrbit(mine, transform.position ?? Vector3.Zero())
}

/**
 * Drives the mine's endless orbit + cone sweep with a per-frame system.
 *
 * Position: a circle around the central axis through the start position (radius
 * and start angle derived from it), y locked to the start height.
 *
 * Rotation: composed as inwardYaw * precession * tilt — the local +Z (the laser)
 * is tilted CONE_ANGLE off the inward direction, and the precession spins that
 * tilt around the inward axis, so the beam traces a cone aimed at the centre.
 *
 * The system self-removes when the mine is gone (exploded or level teardown).
 */
function startOrbit(mine: ReturnType<typeof engine.addEntity>, startPosition: Vector3) {
  const y = startPosition.y
  const radius = Math.sqrt(startPosition.x * startPosition.x + startPosition.z * startPosition.z)
  // Orbit angle such that position = (radius*sin, y, radius*cos); start where placed.
  let orbitDeg = Math.atan2(startPosition.x, startPosition.z) * (180 / Math.PI)
  let coneDeg = 0

  const systemName = `glider-mine-${mine}`
  engine.addSystem(
    (dt) => {
      const t = Transform.getMutableOrNull(mine)
      if (t === null) {
        engine.removeSystem(systemName) // exploded or level torn down
        return
      }

      orbitDeg = (orbitDeg + ORBIT_SPEED * dt) % 360
      coneDeg = (coneDeg + CONE_SPEED * dt) % 360

      const rad = orbitDeg * (Math.PI / 180)
      t.position = Vector3.create(radius * Math.sin(rad), y, radius * Math.cos(rad))

      // Facing the centre is the orbit angle + 180 about Y; the roll precesses the
      // X tilt around that inward axis (multiply applies right-to-left).
      t.rotation = Quaternion.multiply(
        Quaternion.fromEulerDegrees(0, orbitDeg + 180, 0),
        Quaternion.multiply(
          Quaternion.fromEulerDegrees(0, 0, coneDeg),
          Quaternion.fromEulerDegrees(CONE_ANGLE, 0, 0)
        )
      )
    },
    undefined,
    systemName
  )
}
