import { engine, Transform, GltfContainer, MeshRenderer } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { SCENE_CENTER, SCENE_SIZE } from './config'


/**
 * Invisible walls around the scene's parcel boundary that keep the player from
 * walking off the edge of the scene. Created once at boot (scene-local coords),
 * so they persist across every experience.
 */
export function createBoundaryWalls(): void {
  const entity = engine.addEntity()
  Transform.create(entity, { scale: Vector3.create(0.98, 0.98, 0.98), position: Vector3.create(0.1, 0.25, SCENE_CENTER)})
  //MeshRenderer.setBox(entity)
  GltfContainer.create(entity, { src: 'models/sceneWallCollider.glb' })
}
