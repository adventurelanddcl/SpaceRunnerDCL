import { engine, Entity, Material, MeshRenderer, Transform, TransformTypeWithOptionals } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { SCENE_CENTER, SCENE_SIZE } from './config'

/**
 * Path to the skybox image.
 */
const texturePath = 'images/skybox.jpg'

/**
 * Creates a cubic skybox around the scene using 6 planes (one per face).
 *
 * Each plane is positioned and rotated to form a cube surrounding the scene,
 * with a shared texture applied to simulate a sky environment.
 */
export function createSkyBox(parent: Entity): Entity {
  const skyBoxRoot = engine.addEntity()
  Transform.create(skyBoxRoot, { parent })

  const faces: TransformTypeWithOptionals[] = [
    { position: Vector3.create(0, 0, SCENE_CENTER) },
    {
      position: Vector3.create(0, 0, -SCENE_CENTER),
      rotation: Quaternion.fromEulerDegrees(0, 180, 0)
    },
    {
      position: Vector3.create(SCENE_CENTER, 0, 0),
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      position: Vector3.create(-SCENE_CENTER, 0, 0),
      rotation: Quaternion.fromEulerDegrees(0, -90, 0)
    },
    {
      position: Vector3.create(0, SCENE_CENTER, 0),
      rotation: Quaternion.fromEulerDegrees(-90, 0, 0)
    },
    {
      position: Vector3.create(0, -SCENE_CENTER, 0),
      rotation: Quaternion.fromEulerDegrees(90, 0, 0)
    }
  ]

  faces.forEach((face) => {
    const plane = engine.addEntity()
    Transform.create(plane, {
      ...face,
      // Slightly larger scale prevents visible seams between faces
      scale: Vector3.create(SCENE_SIZE + 0.1, SCENE_SIZE + 0.1, SCENE_SIZE + 0.1),
      parent: skyBoxRoot
    })
    MeshRenderer.setPlane(plane)
    Material.setBasicMaterial(plane, { texture: Material.Texture.Common({ src: texturePath }) })
  })

  return skyBoxRoot
}
