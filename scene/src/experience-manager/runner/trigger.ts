import {
  ColliderLayer,
  engine,
  Transform,
  TransformTypeWithOptionals,
  TriggerArea,
  triggerAreaEventsSystem,
  MeshRenderer
} from '@dcl/sdk/ecs'

/**
 * Creates a trigger area entity that reacts when the player enters or exits it.
 *
 * - Detects player-only collisions
 * - Reacts on enter (default) or exit, selected via `triggerOn`
 * - Optional one-time trigger behavior
 * - Prevents multiple rapid firings
 */
export function createTrigger(
  transform: TransformTypeWithOptionals,
  onTrigger: () => void,
  triggerOnce?: boolean,
  triggerOn: 'enter' | 'exit' = 'enter'
) {
  const trigger = engine.addEntity()
  Transform.create(trigger, transform)

  TriggerArea.setBox(trigger, ColliderLayer.CL_PLAYER)

  //MeshRenderer.setBox(trigger)

  // Internal guard to prevent multiple executions in the same frame or before removal
  let hasTriggered = false

  const handle = (result: { trigger?: { entity: number } }) => {
    // Ignore if already triggered (for trigger once)
    if (triggerOnce && hasTriggered) return

    if (result.trigger?.entity !== engine.PlayerEntity) return
    hasTriggered = true

    onTrigger()

    if (triggerOnce) engine.removeEntity(trigger)
  }

  if (triggerOn === 'exit') {
    triggerAreaEventsSystem.onTriggerExit(trigger, handle)
  } else {
    triggerAreaEventsSystem.onTriggerEnter(trigger, handle)
  }

  return trigger
}
