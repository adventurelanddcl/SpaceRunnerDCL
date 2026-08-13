import { engine, AudioSource, Entity, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

/**
 * How long (ms) a one-shot sound entity lives before being cleaned up.
 * Must be at least the clip length so playback isn't cut short.
 */
const ONESHOT_LIFETIME = 3000

/**
 * Attaches a continuously looping, spatial sound to an entity.
 *
 * Decentraland's AudioSource is positional, so the player hears the sound grow
 * louder as they approach the entity. If the entity moves (e.g. a tweened ball or
 * laser wall) the sound follows it. Use this for ambient obstacle sounds.
 */
export function attachLoopingSound(entity: Entity, file: string, volume = 1): void {
  AudioSource.createOrReplace(entity, {
    audioClipUrl: file,
    loop: true,
    playing: true,
    volume
  })
}

export function playOneShotOnPlayer(file: string, volume = 1): void {
  const soundEntity = engine.addEntity()
  Transform.create(soundEntity, { parent: engine.PlayerEntity })
  AudioSource.createOrReplace(soundEntity, {
    audioClipUrl: file,
    loop: false,
    playing: true,
    volume
  })
  utils.timers.setTimeout(() => {
    try {
      engine.removeEntity(soundEntity)
    } catch (_e) {
      /* already removed (e.g. on level switch) */
    }
  }, ONESHOT_LIFETIME)
}
