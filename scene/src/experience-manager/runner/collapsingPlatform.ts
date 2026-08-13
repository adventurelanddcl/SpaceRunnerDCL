import {
  engine,
  Animator,
  GltfContainer,
  Transform,
  ColliderLayer,
  removeEntityWithChildren,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

import { createTrigger } from './trigger'

/** Model used for the collapsing platform (its animation makes it disappear). */
const MODEL = 'models/collapsingPlatformBlue.glb'

/** Name of the disappear animation clip inside the GLB. */
const CLIP = 'Animation'

/** How long (ms) the collapse animation takes before the platform is gone. */
const DISAPPEAR_DELAY = 1800

/** How long (ms) after being triggered a fresh platform appears (and rearms). */
const REAPPEAR_DELAY = 5000

/** Trigger area on top of the platform that detects the player stepping on it. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(2.5, 1, 2.5),
  position: Vector3.create(0, 0.5, 0)
}

/**
 * Creates a collapsing platform.
 * @param transform Base transform (position/parent/rotation/scale).
 */
export function createCollapsingPlatform(transform: TransformTypeWithOptionals) {
  const parent = transform.parent

  const spawn = () => {
    // Don't respawn into a torn-down level (e.g. after a reset/level switch).
    if (parent !== undefined && Transform.getOrNull(parent) === null) return

    const platform = engine.addEntity()
    Transform.create(platform, { ...transform })
    // Solid + visible; the model's collider is the invisible *_collider mesh.
    GltfContainer.create(platform, { src: MODEL })
    // Animation present but stopped, so the platform stays visible until triggered.
    Animator.create(platform, { states: [{ clip: CLIP, playing: false, loop: false }] })

    let triggered = false
    const onStep = () => {
      if (triggered) return
      triggered = true

      // Play the disappear animation.
      Animator.playSingleAnimation(platform, CLIP)

      // Once it has collapsed, remove this platform (and its trigger child) so the
      // player falls through and no stale state lingers.
      utils.timers.setTimeout(() => {
        if (Transform.getOrNull(platform) !== null) removeEntityWithChildren(engine, platform)
      }, DISAPPEAR_DELAY)

      utils.timers.setTimeout(spawn, REAPPEAR_DELAY)
    }

    createTrigger({ ...TRIGGER_TRANSFORM, parent: platform }, onStep)
  }

  spawn()
}
