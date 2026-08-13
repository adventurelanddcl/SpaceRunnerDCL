import {
  Animator,
  engine,
  Entity,
  GltfContainer,
  Transform,
  Tween,
  TweenSequence,
  TweenLoop,
  EasingFunction,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'
import { playOneShotOnPlayer } from './sound'
import { spawnDamageBurst } from './damageParticles'
import { sendHitBallTrap } from '../../client/connection'

/** Model used for the spike plate. */
const MODEL = 'models/spikePlate.glb'
const CLIP = 'Animation'

/** One-shot sound played when the spikes catch the player. */
const HIT_SOUND = 'sounds/ballHit.mp3'

/** Default travel speed, in units per second (constant across all segments). */
const DEFAULT_SPEED = 5

/** Seconds the spikes stay down between extensions (the safe window). */
const DEFAULT_SAFE_TIME = 2

/**
 * Timing of the baked clip, measured from spikePlate.glb so the damage volume
 * tracks the spikes exactly: the spike mesh rises over the first 0.21s, sits out
 * until 2.71s, then drops back by the clip's end at 2.92s.
 */
const ANIM_DURATION = 2.92
const ANIM_RISE_END = 0.21
const ANIM_FALL_START = 2.71

/** Trigger footprint: a little inside the 2.56m plate so it can't catch a player
 * brushing past the edge. */
const TRIGGER_SIZE = 5
const TRIGGER_HEIGHT = 0.5

/** Trigger height when the spikes are fully out — sitting above the plate face,
 * covering the spikes. */
const TRIGGER_ACTIVE_Y = 1

/** Trigger height when the spikes are down: parked well under the plate, where
 * the player can't reach it, so a retracted plate is completely safe. */
const TRIGGER_HIDDEN_Y = -0.5

/** One spike plate, as defined in a map. */
export type SpikePlateConfig = {
  /** Looped waypoints the plate patrols, in the game area's local space. Give a
   * single point for a stationary plate. */
  path: Vector3[]
  /** Travel speed in units per second (default DEFAULT_SPEED). */
  speed?: number
  /** Seconds the spikes stay retracted between extensions (default
   * DEFAULT_SAFE_TIME) — the window the player can safely cross. */
  safeTime?: number
}

/**
 * Creates a spike plate: a patrolling plate whose spikes periodically stab out.
 *
 * It travels its path like the ball trap (an SDK tween on the transform, so the
 * damage volume rides along). On a timer it plays the baked spike animation once
 * — spikes up, hold, spikes down — then waits `safeTime` and repeats.
 *
 * The damage volume follows the spikes rather than simply switching on and off:
 * it rises with them over the clip's opening, stays up while they are out, and
 * drops back UNDER the plate as they retract. While retracted it sits well below
 * the model, so a player standing on a dormant plate cannot be hit.
 *
 * @param transform Base transform (parent/rotation/scale). Position comes from path[0].
 * @param path Looped waypoints the plate travels through, in the parent's local space.
 * @param speed Travel speed in units per second.
 * @param safeTime Seconds the spikes stay down between extensions.
 */
export function createSpikePlate(
  transform: TransformTypeWithOptionals,
  path: Vector3[],
  speed: number = DEFAULT_SPEED,
  safeTime: number = DEFAULT_SAFE_TIME
): void {
  const start = path.length > 0 ? path[0] : Vector3.Zero()

  // Mover: carries the patrol tween, the model and the trigger.
  const mover = engine.addEntity()
  Transform.create(mover, { ...transform, position: start })

  // Visual child so the model can animate without disturbing the mover's tween.
  const visual = engine.addEntity()
  Transform.create(visual, { parent: mover })
  GltfContainer.create(visual, { src: MODEL })
  // Registered but idle: each cycle replays it once from the top.
  Animator.create(visual, { states: [{ clip: CLIP, playing: false, loop: false }] })

  if (path.length > 1) {
    startPatrol(mover, path, speed)
  }

  const trigger = createTrigger(
    {
      parent: mover,
      position: Vector3.create(0, TRIGGER_HIDDEN_Y, 0),
      scale: Vector3.create(TRIGGER_SIZE, TRIGGER_HEIGHT, TRIGGER_SIZE)
    },
    () => {
      // Server applies the damage (5); the rest is local feedback.
      sendHitBallTrap()
      spawnDamageBurst()
      playOneShotOnPlayer(HIT_SOUND)
    }
  )

  startSpikeCycle(mover, visual, trigger, safeTime)
}

/**
 * Runs the extend/retract cycle: wait out the safe window, play the clip once
 * while lifting the damage volume with the spikes, then drop it back under the
 * plate. Self-removes once the plate is gone (level teardown).
 */
function startSpikeCycle(mover: Entity, visual: Entity, trigger: Entity, safeTime: number): void {
  const systemName = `spike-plate-${mover}`
  let timer = 0
  let spikesOut = false

  engine.addSystem(
    (dt: number) => {
      const triggerTransform = Transform.getMutableOrNull(trigger)
      if (triggerTransform === null || Transform.getOrNull(mover) === null) {
        engine.removeSystem(systemName)
        return
      }

      timer += dt

      if (!spikesOut) {
        // Safe window: spikes down, volume parked under the plate.
        if (timer >= safeTime) {
          Animator.playSingleAnimation(visual, CLIP, true)
          spikesOut = true
          timer = 0
        }
        return
      }

      if (timer >= ANIM_DURATION) {
        // Clip finished on its retracted pose — go quiet until the next cycle.
        Animator.stopAllAnimations(visual, true)
        triggerTransform.position = Vector3.create(0, TRIGGER_HIDDEN_Y, 0)
        spikesOut = false
        timer = 0
        return
      }

      triggerTransform.position = Vector3.create(0, spikeTriggerY(timer), 0)
    },
    undefined,
    systemName
  )
}

/**
 * Height of the damage volume at `t` seconds into the clip, following the same
 * profile as the baked spike motion: up over the opening, held while the spikes
 * are out, back under the plate as they drop.
 */
function spikeTriggerY(t: number): number {
  if (t <= ANIM_RISE_END) {
    return lerp(TRIGGER_HIDDEN_Y, TRIGGER_ACTIVE_Y, t / ANIM_RISE_END)
  }
  if (t < ANIM_FALL_START) {
    return TRIGGER_ACTIVE_Y
  }
  const fall = (t - ANIM_FALL_START) / (ANIM_DURATION - ANIM_FALL_START)
  return lerp(TRIGGER_ACTIVE_Y, TRIGGER_HIDDEN_Y, Math.min(1, fall))
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

/**
 * Drives an entity along a looped path using a tween sequence.
 *
 * TL_RESTART replays the initial Tween together with the sequence on every cycle,
 * so for a seamless loop the sequence must end where the initial Tween starts
 * (path[0]). One full cycle is: path[0]->path[1]->...->path[N-1]->path[0].
 */
function startPatrol(entity: Entity, path: Vector3[], speed: number): void {
  Tween.create(entity, {
    mode: Tween.Mode.Move({ start: path[0], end: path[1] }),
    duration: segmentDuration(path[0], path[1], speed),
    easingFunction: EasingFunction.EF_LINEAR
  })

  const sequence = []
  for (let i = 1; i < path.length; i++) {
    const from = path[i]
    const to = path[(i + 1) % path.length]
    sequence.push({
      mode: Tween.Mode.Move({ start: from, end: to }),
      duration: segmentDuration(from, to, speed),
      easingFunction: EasingFunction.EF_LINEAR
    })
  }
  TweenSequence.create(entity, { sequence, loop: TweenLoop.TL_RESTART })
}

/** Milliseconds to travel from `a` to `b` at `speed` units/second. */
function segmentDuration(a: Vector3, b: Vector3, speed: number): number {
  return Math.max(1, (Vector3.distance(a, b) / speed) * 1000)
}
