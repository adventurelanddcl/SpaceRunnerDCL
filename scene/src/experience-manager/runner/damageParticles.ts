import {
  engine,
  Transform,
  ParticleSystem,
  PBParticleSystem_BlendMode,
  PBParticleSystem_SimulationSpace
} from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

/** Particle lifespan (s); the burst is fully faded out by then. */
const PARTICLE_LIFETIME = 0.8

/** Particles per burst. Kept small: the engine budget is ~1000 live particles
 * scene-wide, and rapid re-entries into lasers can stack several bursts. */
const BURST_COUNT = 50

/** How long (ms) the emitter entity lives before cleanup (> burst + lifetime). */
const EMITTER_CLEANUP_MS = 2000

/**
 * Red damage burst on the player: particles spray off the avatar whenever a trap
 * damages them (lasers, ball trap, swing beam, bounces, mine explosion).
 *
 * A fresh one-shot emitter is created per hit (re-triggering an existing one-shot
 * system doesn't replay, same as AudioSource) and parented to the player. With
 * `PSS_LOCAL` simulation the whole burst rides along with the avatar while it
 * plays — particles fly outward off the body but stay centred on the player even
 * mid-knockback. The emitter removes itself once the burst dies.
 */
export function spawnDamageBurst(): void {
  const emitter = engine.addEntity()
  // Mid-body height so the spray wraps the avatar rather than their feet.
  Transform.create(emitter, { parent: engine.PlayerEntity, position: Vector3.create(0, 1, 0) })

  ParticleSystem.create(emitter, {
    loop: false,
    rate: 0,
    lifetime: PARTICLE_LIFETIME,
    maxParticles: BURST_COUNT,
    initialSize: { start: 0.08, end: 0.18 },
    sizeOverTime: { start: 1, end: 0 },
    initialColor: { start: Color4.create(1, 0.15, 0.05, 1), end: Color4.create(1, 0.45, 0.1, 1) },
    // Fade to transparent dark red — alpha 0 at the end is what fades them out.
    colorOverTime: { start: Color4.create(1, 0.2, 0.1, 1), end: Color4.create(0.5, 0, 0, 0) },
    initialVelocitySpeed: { start: 3, end: 5 },
    gravity: 0.6,
    blendMode: PBParticleSystem_BlendMode.PSB_ADD,
    // Spawn shell around the avatar's body; particles fly outward from it.
    shape: ParticleSystem.Shape.Sphere({ radius: 0.4 }),
    // Local space: the burst stays attached to the (parented-to-player) emitter,
    // so the particles travel with the avatar for their whole lifetime.
    simulationSpace: PBParticleSystem_SimulationSpace.PSS_LOCAL,
    bursts: { values: [{ time: 0, count: BURST_COUNT, cycles: 1, interval: 0.01, probability: 1 }] }
  })

  utils.timers.setTimeout(() => engine.removeEntity(emitter), EMITTER_CLEANUP_MS)
}
