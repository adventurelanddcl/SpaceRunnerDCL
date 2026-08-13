import {
  ColliderLayer,
  engine,
  Entity,
  GltfContainer,
  Material,
  MaterialTransparencyMode,
  MeshRenderer,
  ParticleSystem,
  PBParticleSystem_BlendMode,
  PBParticleSystem_SimulationSpace,
  RaycastQueryType,
  raycastSystem,
  Transform,
  VisibilityComponent
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color3, Color4 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBallTrap } from '../../client/connection'

/** Model used for the falling meteor. */
const MODEL = 'models/meteor.glb'

/** Impact sound (shared with the other explosive traps). */
const IMPACT_SOUND = 'sounds/ballHit.mp3'

/** Defaults for anything a map doesn't specify. */
const DEFAULT_INTERVAL = 6
const DEFAULT_FALL_HEIGHT = 40
const DEFAULT_FALL_SPEED = 25
const DEFAULT_WARNING_TIME = 1.5
const DEFAULT_IMPACT_RADIUS = 3

/** How far above/below the impact height the player still counts as hit, so a
 * meteor landing on a roof doesn't damage someone standing under it. */
const DAMAGE_VERTICAL_TOLERANCE = 4

/** Warning-marker look: translucent orange, unlit enough to read against any map. */
const WARNING_COLOR = Color4.create(1, 0.15, 0, 0.05)
const WARNING_EMISSIVE = Color3.create(1, 0.15, 0)
const WARNING_EMISSIVE_INTENSITY = 2

/** Thickness of the ground ring and radius of the incoming-path beam.
 *
 * `setCylinder(e, 1, 1)` builds a radius-1 primitive, so an entity scale of R
 * gives a cylinder of radius R — the ring is scaled by `impactRadius` directly so
 * it matches the damage zone exactly (scaling by the diameter drew it twice the
 * size it should be, promising a bigger blast than the meteor actually deals). */
const RING_THICKNESS = 0.04
const BEAM_RADIUS = 0.1

/** Explosion burst tuning (mirrors damageParticles, in orange and world space). */
const EXPLOSION_PARTICLES = 60
const EXPLOSION_LIFETIME = 1.1
const EXPLOSION_CLEANUP_MS = 2500

/** How long (ms) the collapsed meteor entity lingers before removal. */
const METEOR_CLEANUP_MS = 500

/**
 * One meteor hazard, as defined in a map. A single entry keeps striking for as
 * long as the level is alive, picking a fresh random spot inside its area each
 * time — so one definition covers a whole bombarded region.
 */
export type MeteorConfig = {
  /** Centre of the strike area, at ground height, local to the game area. */
  position: Vector3
  /** Size of the strike area: impact points are picked at random within
   * ±areaSize.x/2 and ±areaSize.z/2 of `position` (y is unused). */
  areaSize: Vector3
  /** Seconds between strikes (default DEFAULT_INTERVAL). */
  interval?: number
  /** How high above `position.y` a meteor spawns (default DEFAULT_FALL_HEIGHT). */
  fallHeight?: number
  /** Descent speed in units/second (default DEFAULT_FALL_SPEED). */
  fallSpeed?: number
  /** Seconds the ring and beam show before the meteor drops (default
   * DEFAULT_WARNING_TIME) — the player's time to clear the area. */
  warningTime?: number
  /** Radius of the impact ring and the damage zone (default DEFAULT_IMPACT_RADIUS). */
  impactRadius?: number
}

/** Phases of one strike cycle. */
type Phase = 'idle' | 'aiming' | 'warning' | 'falling'

/**
 * Creates a periodic meteor strike inside a map-defined area.
 *
 * Each cycle: a random spot in the area is chosen and a ray is cast straight down
 * from the spawn height to find what the meteor will actually hit — the ground,
 * or the first collider in the way (a platform, a roof). The impact point is that
 * hit, so a meteor falling onto a structure stops there instead of clipping
 * through to the floor.
 *
 * A translucent orange ring marks the impact zone and a matching beam marks the
 * fall path for `warningTime` seconds, then the meteor drops. On impact it scales
 * to nothing, throws an orange explosion burst, and deals 5 damage to a player
 * standing inside the ring.
 *
 * Everything is parented to a root inside the game area, so a level teardown
 * removes the markers and stops the cycle (the driving system self-removes once
 * its root is gone).
 *
 * @param parent Game-area root.
 * @param config Strike area and timing (see MeteorConfig).
 */
export function createMeteor(parent: Entity, config: MeteorConfig): void {
  const interval = config.interval ?? DEFAULT_INTERVAL
  const fallHeight = config.fallHeight ?? DEFAULT_FALL_HEIGHT
  const fallSpeed = config.fallSpeed ?? DEFAULT_FALL_SPEED
  const warningTime = config.warningTime ?? DEFAULT_WARNING_TIME
  const impactRadius = config.impactRadius ?? DEFAULT_IMPACT_RADIUS

  // Root anchors the whole hazard: markers hang off it and the driving system
  // stops as soon as it is gone (level teardown).
  const root = engine.addEntity()
  Transform.create(root, { position: config.position, parent })

  // Spawn height is measured from the area's ground plane (root local y 0).
  const topY = fallHeight

  // --- Warning markers, built once and toggled per strike ---
  const ring = engine.addEntity()
  Transform.create(ring, {
    // Scale == radius (see RING_THICKNESS note), so the ring covers exactly the
    // area that will take damage.
    scale: Vector3.create(impactRadius, RING_THICKNESS, impactRadius),
    parent: root
  })
  MeshRenderer.setCylinder(ring, 1, 1)
  applyWarningMaterial(ring)
  VisibilityComponent.create(ring, { visible: false })

  const beam = engine.addEntity()
  Transform.create(beam, { parent: root })
  MeshRenderer.setCylinder(beam, 1, 1)
  applyWarningMaterial(beam)
  VisibilityComponent.create(beam, { visible: false })

  // --- Ray probe: stays put at the area's origin; each cycle aims the ray with
  // the raycast's own `originOffset` rather than by moving this entity. Moving it
  // and casting in the same frame is a race — the renderer could evaluate the ray
  // against the PREVIOUS position, reporting a hit distance that belongs to last
  // cycle's spot (or, on the first strike, to the area centre at ground level,
  // which comes back as a hit at ~0 distance and blows the meteor up at spawn
  // height). Encoding the aim in the raycast component keeps it atomic.
  const probe = engine.addEntity()
  Transform.create(probe, { parent: root })

  let phase: Phase = 'idle'
  let timer = 0
  /** Impact point for the current cycle, in the root's local space. */
  let impact = Vector3.Zero()
  let meteor: Entity | undefined

  /** Picks a spot, aims the ray, and shows the markers where it lands. */
  function beginAiming(): void {
    const half = config.areaSize
    const x = (Math.random() - 0.5) * half.x
    const z = (Math.random() - 0.5) * half.z

    phase = 'aiming'

    raycastSystem.registerGlobalDirectionRaycast(
      {
        entity: probe,
        opts: {
          // Ray starts at the probe (area origin) offset up to the spawn point,
          // so the origin travels with the aim without touching the Transform.
          originOffset: Vector3.create(x, topY, z),
          direction: Vector3.create(0, -1, 0),
          // A little past the ground plane so a flat floor still registers.
          maxDistance: topY + 5,
          // Physical geometry only — never trigger volumes or pointer colliders.
          collisionMask: ColliderLayer.CL_PHYSICS,
          queryType: RaycastQueryType.RQT_HIT_FIRST
        }
      },
      (result) => {
        // Only act on the cast we are waiting for (results can arrive late, e.g.
        // after a teardown or once the next cycle has already started).
        if (phase !== 'aiming') return

        // Use the hit DISTANCE rather than its absolute position: the ray starts
        // at local y = topY and points straight down, so the impact height is
        // topY - length. That is independent of where the game area sits in the
        // world, so no local/global conversion can go wrong.
        const hit = result.hits.length > 0 ? result.hits[0] : undefined
        // No hit => nothing in the way, so it falls the whole way to the ground
        // plane. Clamped to [0, topY] so a stray reading can't strand the impact
        // above the spawn point or below the floor.
        const rawY = hit !== undefined ? topY - hit.length : 0
        const impactY = Math.max(0, Math.min(topY, rawY))

        impact = Vector3.create(x, impactY, z)
        showMarkers()
        phase = 'warning'
        timer = 0
      }
    )
  }

  /** Places and reveals the impact ring and the fall-path beam. */
  function showMarkers(): void {
    const ringTransform = Transform.getMutable(ring)
    // Lifted a hair so it doesn't z-fight with the surface it marks.
    ringTransform.position = Vector3.create(impact.x, impact.y + RING_THICKNESS, impact.z)
    VisibilityComponent.getMutable(ring).visible = true

    const beamHeight = Math.max(0.1, topY - impact.y)
    const beamTransform = Transform.getMutable(beam)
    beamTransform.position = Vector3.create(impact.x, impact.y + beamHeight / 2, impact.z)
    beamTransform.scale = Vector3.create(BEAM_RADIUS, beamHeight, BEAM_RADIUS)
    VisibilityComponent.getMutable(beam).visible = true
  }

  function hideMarkers(): void {
    VisibilityComponent.getMutable(ring).visible = false
    VisibilityComponent.getMutable(beam).visible = false
  }

  /** Spawns the meteor at the top of its path. */
  function beginFall(): void {
    const entity = engine.addEntity()
    Transform.create(entity, {
      position: Vector3.create(impact.x, topY, impact.z),
      parent: root
    })
    GltfContainer.create(entity, { src: MODEL })
    meteor = entity
    phase = 'falling'
  }

  /** Drops the meteor, landing it exactly on the impact point. */
  function advanceFall(dt: number): void {
    if (meteor === undefined) {
      phase = 'idle'
      timer = 0
      return
    }
    const transform = Transform.getMutableOrNull(meteor)
    if (transform === null) {
      meteor = undefined
      phase = 'idle'
      timer = 0
      return
    }

    const nextY = transform.position.y - fallSpeed * dt
    if (nextY <= impact.y) {
      transform.position = Vector3.create(impact.x, impact.y, impact.z)
      strike()
      return
    }
    transform.position = Vector3.create(impact.x, nextY, impact.z)
  }

  /** Impact: collapse the meteor, explode, damage anyone inside the ring. */
  function strike(): void {
    hideMarkers()

    if (meteor !== undefined) {
      const transform = Transform.getMutableOrNull(meteor)
      // Scale to nothing so it vanishes on contact rather than sinking through.
      if (transform !== null) transform.scale = Vector3.Zero()
      const dying = meteor
      utils.timers.setTimeout(() => {
        try {
          engine.removeEntity(dying)
        } catch (_e) {
          /* already gone with the level */
        }
      }, METEOR_CLEANUP_MS)
      meteor = undefined
    }

    spawnExplosion(root, impact)

    if (playerInImpactZone(root, impact, impactRadius)) {
      // Server applies the damage (5); the burst and sound are local feedback.
      sendHitBallTrap()
      spawnDamageBurst()
      playOneShotOnPlayer(IMPACT_SOUND)
    }

    phase = 'idle'
    timer = 0
  }

  const systemName = `meteor-${root}`
  engine.addSystem(
    (dt: number) => {
      // Root gone => the level was torn down; stop driving this hazard.
      if (Transform.getOrNull(root) === null) {
        engine.removeSystem(systemName)
        return
      }

      timer += dt
      if (phase === 'idle') {
        if (timer >= interval) beginAiming()
      } else if (phase === 'warning') {
        if (timer >= warningTime) beginFall()
      } else if (phase === 'falling') {
        advanceFall(dt)
      }
      // 'aiming' waits on the raycast callback.
    },
    undefined,
    systemName
  )
}

/** Translucent orange used by both warning markers. */
function applyWarningMaterial(entity: Entity): void {
  Material.setPbrMaterial(entity, {
    albedoColor: WARNING_COLOR,
    emissiveColor: WARNING_EMISSIVE,
    emissiveIntensity: WARNING_EMISSIVE_INTENSITY,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    metallic: 0,
    roughness: 1,
    castShadows: false
  })
}

/**
 * Orange explosion burst at the impact point. World-space simulation so the
 * debris keeps flying outward from where it landed instead of riding the emitter.
 */
function spawnExplosion(parent: Entity, position: Vector3): void {
  const emitter = engine.addEntity()
  Transform.create(emitter, { position, parent })

  ParticleSystem.create(emitter, {
    loop: false,
    rate: 0,
    lifetime: EXPLOSION_LIFETIME,
    maxParticles: EXPLOSION_PARTICLES,
    initialSize: { start: 0.2, end: 0.5 },
    sizeOverTime: { start: 1, end: 0 },
    initialColor: { start: Color4.create(1, 0.6, 0.1, 1), end: Color4.create(1, 0.3, 0, 1) },
    // Alpha 0 at the end is what fades the burst out.
    colorOverTime: { start: Color4.create(1, 0.5, 0.05, 1), end: Color4.create(0.4, 0.1, 0, 0) },
    initialVelocitySpeed: { start: 5, end: 9 },
    gravity: 1.2,
    blendMode: PBParticleSystem_BlendMode.PSB_ADD,
    shape: ParticleSystem.Shape.Sphere({ radius: 0.5 }),
    simulationSpace: PBParticleSystem_SimulationSpace.PSS_WORLD,
    bursts: { values: [{ time: 0, count: EXPLOSION_PARTICLES, cycles: 1, interval: 0.01, probability: 1 }] }
  })

  utils.timers.setTimeout(() => {
    try {
      engine.removeEntity(emitter)
    } catch (_e) {
      /* already gone with the level */
    }
  }, EXPLOSION_CLEANUP_MS)
}

/**
 * Whether the player is standing in the strike's impact zone: inside the ring
 * horizontally and at roughly the impact height (so a meteor stopped on a
 * platform doesn't hit someone on the floor below).
 */
function playerInImpactZone(root: Entity, impact: Vector3, radius: number): boolean {
  const player = Transform.getOrNull(engine.PlayerEntity)
  if (player === null) return false

  const impactWorld = toWorld(root, impact)
  const dx = player.position.x - impactWorld.x
  const dz = player.position.z - impactWorld.z
  if (dx * dx + dz * dz > radius * radius) return false

  return Math.abs(player.position.y - impactWorld.y) <= DAMAGE_VERTICAL_TOLERANCE
}

/**
 * Converts a point in `parent`'s local space to world space by composing every
 * parent transform up the chain (the meteor's coordinates are local to the game
 * area, while the player's are world).
 */
function toWorld(parent: Entity, local: Vector3): Vector3 {
  let position = Vector3.create(local.x, local.y, local.z)
  let current: Entity | undefined = parent

  while (current !== undefined && current !== engine.RootEntity && Transform.has(current)) {
    const transform = Transform.get(current)
    position = Vector3.multiply(position, transform.scale)
    position = Vector3.rotate(position, transform.rotation)
    position = Vector3.add(position, transform.position)
    current = transform.parent
  }

  return position
}
