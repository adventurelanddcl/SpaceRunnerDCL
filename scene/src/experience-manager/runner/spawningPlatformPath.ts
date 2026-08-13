import { engine, Entity, GltfContainer, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createTrigger } from './trigger'

/** Model used for each path platform. */
const MODEL = 'models/spawningPlatformPath.glb'

/**
 * Stepping on a platform spawns every unspawned platform within this distance.
 *
 * Tuned against the map layouts: in-line neighbours sit 3.5-4 apart and branch
 * (road-split) platforms 5.5-5.65 apart — both inside the radius, so a split
 * spawns all of its branches at once — while two-ahead platforms are >= 7 away
 * and stay hidden until actually reached.
 */
const DEFAULT_SPAWN_RADIUS = 7.5

/** Trigger area on top of a platform that detects the player stepping on it. */
const TRIGGER_TRANSFORM: TransformTypeWithOptionals = {
  scale: Vector3.create(3.75, 1, 1.75),
  position: Vector3.create(0, 0.5, 0)
}

/**
 * Creates a path of stepping-stone platforms that reveal themselves as the player
 * advances.
 *
 * Only the `start` platforms exist when the level is built. Stepping on any
 * platform spawns every not-yet-spawned platform within `spawnRadius` of it —
 * usually just the next platform in line, but where roads split all of the
 * branch platforms appear together (proximity decides; no explicit graph needed).
 * Spawned platforms stay until the level is rebuilt.
 *
 * @param parent Game-area root; all platforms are parented to it for cleanup.
 * @param start Platforms visible from the start.
 * @param platforms Hidden platforms revealed as the player progresses.
 * @param spawnRadius Reveal distance (see DEFAULT_SPAWN_RADIUS).
 */
export function createSpawningPlatformPath(
  parent: Entity | undefined,
  start: TransformTypeWithOptionals[],
  platforms: TransformTypeWithOptionals[],
  spawnRadius: number = DEFAULT_SPAWN_RADIUS
) {
  type Node = { transform: TransformTypeWithOptionals; spawned: boolean }
  const nodes: Node[] = [...start, ...platforms].map((transform) => ({ transform, spawned: false }))
  const startCount = start.length

  const spawn = (node: Node) => {
    if (node.spawned) return
    node.spawned = true

    const platform = engine.addEntity()
    Transform.create(platform, { ...node.transform, parent })
    GltfContainer.create(platform, { src: MODEL })
    // Each platform reveals its own neighbours when stepped on, so discovery
    // chains naturally along whichever branch the player takes.
    createTrigger({ ...TRIGGER_TRANSFORM, parent: platform }, () => reveal(node))
  }

  const reveal = (from: Node) => {
    const p = from.transform.position ?? Vector3.Zero()
    for (const other of nodes) {
      if (other.spawned) continue
      const q = other.transform.position ?? Vector3.Zero()
      if (Vector3.distance(p, q) <= spawnRadius) spawn(other)
    }
  }

  for (let i = 0; i < startCount; i++) spawn(nodes[i])
}
