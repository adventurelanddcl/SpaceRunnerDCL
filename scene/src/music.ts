import { engine, AudioSource, Transform } from '@dcl/sdk/ecs'

/**
 * Looping background soundtrack for the whole scene.
 *
 * The audio entity is created once at startup and never torn down, so the track
 * keeps playing across experience switches instead of restarting every time the
 * player moves between the lobby and the runner (each experience only removes
 * the entities it created — this one belongs to neither).
 *
 * It is parented to the camera and flagged `global`, so it is heard at a constant
 * volume anywhere in the scene rather than fading with distance from a fixed
 * point (that positional behaviour is what `attachLoopingSound` is for, used by
 * the traps).
 */
const SOUNDTRACK = 'sounds/soundtrack1.mp3'

/** Playback volume. Kept well under the traps' one-shots so gameplay cues
 * (impacts, laser hits, gem pickups) still read clearly over the music. */
const MUSIC_VOLUME = 0.35

let musicEntity: number | undefined

/** Starts the looping soundtrack. Safe to call more than once — repeat calls are
 * ignored so the track is never layered on top of itself. */
export function startMusic(): void {
  if (musicEntity !== undefined) return

  const entity = engine.addEntity()
  Transform.create(entity, { parent: engine.CameraEntity })
  AudioSource.create(entity, {
    audioClipUrl: SOUNDTRACK,
    playing: true,
    loop: true,
    volume: MUSIC_VOLUME,
    global: true
  })
  musicEntity = entity
}
