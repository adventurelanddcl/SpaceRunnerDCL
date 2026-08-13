import { engine, GltfContainer, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

import { createTrigger } from './trigger'
import { sendCollectGem } from '../../client/connection'

/**
 * Enum representing all available gem types in the game.
 */
export enum Gem {
  BLACK = '1',
  BLUE = '2',
  PURPLE = '3',
  GOLD = '4'
}

/**
 * Mapping between gem types and their corresponding 3D model paths.
 */
const gemModels: Record<Gem, string> = {
  [Gem.BLACK]: 'models/gemBlack.glb',
  [Gem.BLUE]: 'models/gemBlue.glb',
  [Gem.PURPLE]: 'models/gemPurple.glb',
  [Gem.GOLD]: 'models/gemGold.glb'
}

/**
 * Path to the pickup sound file.
 */
const soundPath = 'sounds/pickUp.mp3'

/**
 * How long (ms) the pickup sound entity lives before being cleaned up.
 * Must be at least the clip length so playback isn't cut short.
 */
const PICKUP_SOUND_LIFETIME = 3000

/**
 * Creates a gem entity.
 *
 * When the player enters the trigger area:
 * - Plays a pickup sound at the player's position
 * - Calls the provided callback
 * - Removes the gem from the engine
 */
export function createGem(transform: TransformTypeWithOptionals, gemType: Gem, onPickUp: () => void) {
  const gem = engine.addEntity()
  Transform.create(gem, transform)
  GltfContainer.create(gem, { src: gemModels[gemType] })

  const handlePickup = () => {
    // Play through a fresh, throwaway entity each time. Re-triggering a shared
    // AudioSource doesn't replay the clip (its `playing` flag is already true, so
    // the renderer sees no change); a new entity always starts playback from the
    // beginning. The entity is removed once the clip has finished to avoid leaks.
    const playerPosition = Transform.get(engine.PlayerEntity).position
    const soundEntity = utils.playSound(soundPath, false, playerPosition)
    utils.timers.setTimeout(() => engine.removeEntity(soundEntity), PICKUP_SOUND_LIFETIME)

    sendCollectGem(Number(gemType))

    onPickUp()

    engine.removeEntity(gem)
  }

  // Default-size trigger box, made 0.5 taller so jumping grabs still register,
  // and lowered 0.5 so it reaches below the (often floating) gem model.
  createTrigger(
    { parent: gem, scale: Vector3.create(1, 2.25, 1), position: Vector3.create(0, -0.5, 0) },
    handlePickup
  )
}
