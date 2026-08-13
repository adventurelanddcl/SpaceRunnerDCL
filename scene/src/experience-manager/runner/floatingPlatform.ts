import {
  engine,
  GltfContainer,
  Transform,
  Tween,
  TweenSequence,
  TweenLoop,
  EasingFunction,
  TransformTypeWithOptionals
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

/** Model used for the floating platform. */
const MODEL = 'models/floatingPlatform.glb'

/** Vertical travel of the float, in metres (up from the base position). */
const FLOAT_HEIGHT = 2.5

/** Random per-leg float time (ms) range (base <-> top). Each platform picks one,
 * so they bob at slightly different speeds and drift out of sync over time. */
const FLOAT_DURATION_MIN = 1600
const FLOAT_DURATION_MAX = 2600

export function createFloatingPlatform(transform: TransformTypeWithOptionals) {
  const base = transform.position ?? Vector3.Zero()
  const top = Vector3.create(base.x, base.y + FLOAT_HEIGHT, base.z)

  // Random phase (which extreme it starts at) and speed; amplitude stays the same.
  const startAtTop = Math.random() < 0.5
  const start = startAtTop ? top : base
  const end = startAtTop ? base : top
  const duration = FLOAT_DURATION_MIN + Math.random() * (FLOAT_DURATION_MAX - FLOAT_DURATION_MIN)

  const platform = engine.addEntity()
  Transform.create(platform, { ...transform, position: start })
  GltfContainer.create(platform, { src: MODEL })

  Tween.create(platform, {
    mode: Tween.Mode.Move({ start, end }),
    duration,
    easingFunction: EasingFunction.EF_EASESINE
  })
  TweenSequence.create(platform, { sequence: [], loop: TweenLoop.TL_YOYO })
}
