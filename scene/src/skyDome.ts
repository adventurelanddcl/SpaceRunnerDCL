import { engine, Transform, GltfContainer, VisibilityComponent, ColliderLayer } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { getPlatform } from './platform'

/** The dome model — an inward-facing sphere/dome so its inside is visible to the
 * player at its centre. */
const MODEL = 'models/mobileRenderDome.glb'

/** Uniform scale applied to the dome GLB. Sized (here or in the model) to sit just
 * within the mobile render distance so it is always drawn: larger and its far
 * surface gets culled (the blue sky reappears); smaller and it starts occluding
 * nearby scene geometry. The dome follows the player, so its centre is always at
 * distance 0 and only its surface distance matters. Tune to taste. */
const DOME_SCALE = 1

/**
 * Creates a black dome (mobileRenderDome.glb) that surrounds and follows the
 * player, shown only on mobile.
 *
 * Mobile has a small render distance shaped like a ball around the player, so
 * distant scene geometry is culled and the blue sky shows at the edge. This dome —
 * kept centred on the player each frame, so it is always within that render ball —
 * paints the edge black instead. Its colliders are disabled so it never blocks the
 * player or the camera. It stays hidden on desktop, whose larger render distance
 * would let this player-sized dome occlude the far scene.
 */
export function createSkyDome(): void {
  const dome = engine.addEntity()
  Transform.create(dome, {
    position: Vector3.Zero(),
    scale: Vector3.create(DOME_SCALE, DOME_SCALE, DOME_SCALE)
  })
  // No colliders: a dome around the player must never trap them or catch the camera.
  GltfContainer.create(dome, {
    src: MODEL,
    visibleMeshesCollisionMask: ColliderLayer.CL_NONE,
    invisibleMeshesCollisionMask: ColliderLayer.CL_NONE
  })
  // Hidden until platform detection (async) confirms mobile.
  VisibilityComponent.create(dome, { visible: false })

  // One system that (a) reveals the dome once we know we're on mobile, and (b)
  // keeps it centred on the player so it always surrounds them.
  let decided = false
  const systemName = 'sky-dome-follow'
  engine.addSystem(
    () => {
      if (!decided) {
        const platform = getPlatform()
        if (platform !== 'unknown') {
          decided = true
          VisibilityComponent.getMutable(dome).visible = platform === 'mobile'
        }
      }

      const playerPos = Transform.getOrNull(engine.PlayerEntity)?.position
      if (playerPos) {
        const t = Transform.getMutableOrNull(dome)
        if (t) t.position = Vector3.create(playerPos.x, playerPos.y, playerPos.z)
      }
    },
    undefined,
    systemName
  )
}
