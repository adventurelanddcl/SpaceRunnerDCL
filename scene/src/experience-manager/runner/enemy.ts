import {
  Animator,
  engine,
  Entity,
  GltfContainer,
  Physics,
  Transform,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBallTrap } from '../../client/connection'

/** Model used for the enemy (its single baked clip loops continuously). */
const MODEL = 'models/enemy1Animated.glb'
const CLIP = 'Animation'

/** One-shot sound played when the enemy connects. */
const HIT_SOUND = 'sounds/ballHit.mp3'

/** Defaults for anything a map doesn't specify. */
const DEFAULT_SPEED = 3
const DEFAULT_CHARGE_SPEED = 12
const DEFAULT_DETECT_RADIUS = 10
const DEFAULT_ALERT_TIME = 1.2
const DEFAULT_KNOCKBACK = 25

/** Contact box, sized to the ~2.1m model. Entering it is a hit. */
const BODY_SIZE = 2.2

/** Seconds the enemy pauses after a charge. If the player is still inside the
 * awareness zone when it ends, it locks on and charges again. */
const DEFAULT_RECHARGE_DELAY = 2

/** Safety cap (s) on a charge, so a blocked enemy can't ram forever. */
const CHARGE_TIMEOUT = 5

/** How close counts as "arrived" at a patrol or charge target. */
const ARRIVE_EPSILON = 0.5

/** Upward share of the knockback relative to the horizontal push. */
const KNOCKBACK_UP_BIAS = 0.25

/** Minimum gap (ms) between hits, so one contact can't drain the player. */
const HIT_COOLDOWN_MS = 1000

/**
 * One patrolling enemy, as defined in a map.
 */
export type EnemyConfig = {
  /** Centre of the patrol volume, local to the game area. */
  position: Vector3
  /** Patrol volume size: the enemy wanders to random points within ±areaSize/2
   * of `position` on all three axes. Give `y` a value to let it roam up and
   * down; leave it 0 to keep it on a single plane. */
  areaSize: Vector3
  /** Patrol movement speed (default DEFAULT_SPEED). */
  speed?: number
  /** Half-extent of the awareness zone: entering it makes the enemy charge
   * (default DEFAULT_DETECT_RADIUS). */
  detectRadius?: number
  /** Speed while ramming (default DEFAULT_CHARGE_SPEED). */
  chargeSpeed?: number
  /** Seconds spent turning to face the target before the ram starts — the
   * player's window to dodge (default DEFAULT_ALERT_TIME). */
  alertTime?: number
  /** Seconds between charges while the player stays inside the awareness zone
   * (default DEFAULT_RECHARGE_DELAY). */
  rechargeDelay?: number
  /** Knockback impulse strength on contact (default DEFAULT_KNOCKBACK). */
  knockback?: number
}

/** Enemy behaviour states. */
type State = 'patrol' | 'alert' | 'charge' | 'recover'

/**
 * Creates a patrolling enemy that charges the player on sight.
 *
 * It wanders its area at walking pace. When the player enters its awareness zone
 * it locks on: the spot where the player was AT THAT MOMENT is remembered, the
 * enemy turns to face it, and after `alertTime` it rams that spot at speed. It
 * commits to the remembered spot rather than tracking the player, so stepping
 * aside during the wind-up makes it miss — dodging is the intended counterplay.
 *
 * Contact knocks the player back and costs 5 health (rate-limited so one bump
 * can't chain-hit), after which the enemy recovers and returns to patrolling.
 *
 * Everything is parented to a root inside the game area, so a level teardown
 * stops it (the driving system self-removes once its root is gone).
 *
 * @param parent Game-area root.
 * @param config Patrol area and behaviour tuning (see EnemyConfig).
 */
export function createEnemy(parent: Entity, config: EnemyConfig): void {
  const speed = config.speed ?? DEFAULT_SPEED
  const chargeSpeed = config.chargeSpeed ?? DEFAULT_CHARGE_SPEED
  const detectRadius = config.detectRadius ?? DEFAULT_DETECT_RADIUS
  const alertTime = config.alertTime ?? DEFAULT_ALERT_TIME
  const rechargeDelay = config.rechargeDelay ?? DEFAULT_RECHARGE_DELAY
  const knockback = config.knockback ?? DEFAULT_KNOCKBACK

  // Root marks the patrol area's origin; the enemy moves in its local space.
  const root = engine.addEntity()
  Transform.create(root, { position: config.position, parent })

  const enemy = engine.addEntity()
  Transform.create(enemy, { position: Vector3.Zero(), parent: root })
  GltfContainer.create(enemy, { src: MODEL })
  Animator.create(enemy, { states: [{ clip: CLIP, playing: true, loop: true }] })

  let state: State = 'patrol'
  let timer = 0
  /** Where the enemy is walking or ramming to, in the root's local space. */
  let target = randomPatrolPoint(config.areaSize)
  let lastHitAt = 0
  /** Whether the player is currently inside the awareness zone. */
  let playerInZone = false

  /** Locks onto wherever the player is standing right now and starts the
   * wind-up. The spot is a snapshot, so they can still step out of the way. */
  function beginAlert(): boolean {
    const spotted = playerLocalPosition(root)
    if (spotted === undefined) return false
    // Full 3D snapshot, height included, so it can ram a player standing above
    // or below it rather than charging past underneath them.
    target = spotted
    state = 'alert'
    timer = 0
    return true
  }

  // Awareness zone. The triggers only track WHETHER the player is inside — the
  // state machine decides when to act on it. Reacting to the enter event alone
  // would fire exactly once: a player who never leaves the volume generates no
  // second enter, so the enemy would charge once and then ignore them forever.
  const detectTransform: TransformTypeWithOptionals = {
    scale: Vector3.create(detectRadius * 2, detectRadius * 2, detectRadius * 2)
  }
  createTrigger({ ...detectTransform, parent: enemy }, () => {
    playerInZone = true
  })
  createTrigger({ ...detectTransform, parent: enemy }, () => {
    playerInZone = false
  }, false, 'exit')

  // Contact box: a hit in any state, rate-limited so a single bump can't drain
  // the player while they are still inside the volume.
  const bodyTransform: TransformTypeWithOptionals = {
    scale: Vector3.create(BODY_SIZE, BODY_SIZE, BODY_SIZE)
  }
  createTrigger({ ...bodyTransform, parent: enemy }, () => {
    const now = Date.now()
    if (now - lastHitAt < HIT_COOLDOWN_MS) return
    lastHitAt = now

    sendHitBallTrap()
    spawnDamageBurst()
    playOneShotOnPlayer(HIT_SOUND)

    const enemyWorld = toWorld(enemy, Vector3.Zero())
    const player = Transform.getOrNull(engine.PlayerEntity)
    if (player === null) return

    // Flatten the push to the horizontal plane so a standing hit throws as hard
    // as a mid-air one, then add a constant upward pop (same as the ball trap).
    let horizontal = Vector3.create(player.position.x - enemyWorld.x, 0, player.position.z - enemyWorld.z)
    if (Vector3.lengthSquared(horizontal) < 0.0001) horizontal = Vector3.Forward()
    horizontal = Vector3.normalize(horizontal)
    Physics.applyImpulseToPlayer(
      Vector3.create(horizontal.x, KNOCKBACK_UP_BIAS, horizontal.z),
      knockback
    )

    // A landed ram is spent — wind down instead of ploughing on.
    if (state === 'charge') {
      state = 'recover'
      timer = 0
    }
  })

  const systemName = `enemy-${root}`
  engine.addSystem(
    (dt: number) => {
      const transform = Transform.getMutableOrNull(enemy)
      if (transform === null) {
        engine.removeSystem(systemName) // level torn down
        return
      }

      timer += dt

      if (state === 'alert') {
        // Turning in place: the wind-up that gives the player time to move.
        faceTowards(transform, target)
        if (timer >= alertTime) {
          state = 'charge'
          timer = 0
        }
        return
      }

      if (state === 'recover') {
        // Winding down after a ram. Once the delay is up, a player still inside
        // the zone gets charged again (re-aimed at where they are NOW); if they
        // left, resume patrolling and wait for them to come back.
        if (timer >= rechargeDelay) {
          if (playerInZone && beginAlert()) return
          target = randomPatrolPoint(config.areaSize)
          state = 'patrol'
          timer = 0
        }
        return
      }

      // Patrolling with the player in range — this is what re-arms the enemy
      // after it returns from a charge, and what catches a player who was
      // already standing inside the zone.
      if (state === 'patrol' && playerInZone && beginAlert()) return

      // patrol / charge: walk toward the current target.
      const moveSpeed = state === 'charge' ? chargeSpeed : speed
      const arrived = moveTowards(transform, target, moveSpeed * dt)
      faceTowards(transform, target)

      if (state === 'charge') {
        // Reaching the remembered spot (or timing out against an obstacle) ends
        // the ram — it committed to that spot, so a miss is a clean miss.
        if (arrived || timer >= CHARGE_TIMEOUT) {
          state = 'recover'
          timer = 0
        }
        return
      }

      if (arrived) target = randomPatrolPoint(config.areaSize)
    },
    undefined,
    systemName
  )
}

/**
 * A random point inside the patrol volume, in the root's local space. `areaSize.y`
 * is the vertical extent, so the enemy roams up and down as well as across; an
 * area with y 0 keeps it on a single plane.
 */
function randomPatrolPoint(areaSize: Vector3): Vector3 {
  return Vector3.create(
    (Math.random() - 0.5) * areaSize.x,
    (Math.random() - 0.5) * areaSize.y,
    (Math.random() - 0.5) * areaSize.z
  )
}

/**
 * Steps the transform toward `target` in 3D, never overshooting. Returns true
 * once it is within ARRIVE_EPSILON. Moving on all three axes is what lets the
 * enemy climb or dive, both while patrolling and mid-charge.
 */
function moveTowards(
  transform: { position: Vector3 },
  target: Vector3,
  step: number
): boolean {
  const dx = target.x - transform.position.x
  const dy = target.y - transform.position.y
  const dz = target.z - transform.position.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (distance <= ARRIVE_EPSILON) return true

  const travel = Math.min(step, distance)
  transform.position = Vector3.create(
    transform.position.x + (dx / distance) * travel,
    transform.position.y + (dy / distance) * travel,
    transform.position.z + (dz / distance) * travel
  )
  return false
}

/**
 * Aims the transform's forward (+Z) at `target` in full 3D, so a climbing or
 * diving enemy tilts into its path instead of sliding along level.
 */
function faceTowards(transform: { position: Vector3; rotation: Quaternion }, target: Vector3): void {
  const dx = target.x - transform.position.x
  const dy = target.y - transform.position.y
  const dz = target.z - transform.position.z
  if (dx * dx + dy * dy + dz * dz < 0.0001) return
  // fromLookAt is singular when the direction is (near-)vertical — swap in a
  // non-parallel up vector for that case.
  const horizontal = Math.sqrt(dx * dx + dz * dz)
  const up = horizontal < 0.001 ? Vector3.Forward() : Vector3.Up()
  transform.rotation = Quaternion.fromLookAt(transform.position, target, up)
}

/**
 * The player's position in `root`'s local space, or undefined if unavailable.
 * The parent chain here carries no rotation or scale, so subtracting the root's
 * world position is an exact conversion.
 */
function playerLocalPosition(root: Entity): Vector3 | undefined {
  const player = Transform.getOrNull(engine.PlayerEntity)
  if (player === null) return undefined
  const origin = toWorld(root, Vector3.Zero())
  return Vector3.create(
    player.position.x - origin.x,
    player.position.y - origin.y,
    player.position.z - origin.z
  )
}

/**
 * Converts a point in `entity`'s local space to world space by composing every
 * parent transform up the chain.
 */
function toWorld(entity: Entity, local: Vector3): Vector3 {
  let position = Vector3.create(local.x, local.y, local.z)
  let current: Entity | undefined = entity

  while (current !== undefined && current !== engine.RootEntity && Transform.has(current)) {
    const transform = Transform.get(current)
    position = Vector3.multiply(position, transform.scale)
    position = Vector3.rotate(position, transform.rotation)
    position = Vector3.add(position, transform.position)
    current = transform.parent
  }

  return position
}
