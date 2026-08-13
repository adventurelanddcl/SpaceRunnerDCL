import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map2: GameMap = {
  modelPath: 'models/map2.glb',
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 20, 0),
  spawnPosition: Vector3.create(84, SCENE_CENTER + 0.75, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 15, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(35, 3.2, 0),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(-36.2, 18, 0),
  finishSize: Vector3.create(11, 7, 12),
  windForceV2s: [
    { position: Vector3.create(-6.5, -20, 0), strength: 45 },
  ],
  ballTraps: [
    {
      path: [Vector3.create(-33.5, 4, 36), Vector3.create(-33.5, 4, -1)],
      speed: 12
    }
  ],
  
  bounceStands: [
    { position: Vector3.create(-27.5, 0.8, 0) },

    { position: Vector3.create(-2, 0.8, -36) },
    { position: Vector3.create(7, 0.8, -36) },

    { position: Vector3.create(-15.5, 0.8, -22.5) },
    { position: Vector3.create(-15.5, 0.8, -13.5) },
    { position: Vector3.create(-15.5, 0.8, -4.5) },
    { position: Vector3.create(-15.5, 0.8, 4.5) },

    { position: Vector3.create(-2, 0.8, 18) },
    { position: Vector3.create(7, 0.8, 18) },

    { position: Vector3.create(-2, 0.8, 36) },
    { position: Vector3.create(7, 0.8, 36) },
    { position: Vector3.create(-11, 0.8, 36) },
    { position: Vector3.create(-20, 0.8, 36) },


   
  ],
  
  spawningPlatformUPs: [
    { position: Vector3.create(-21.5, 1, 0), showPointerArrow: true, maxBlockHeight: 16, maxDistance: 6, boundary: 7 }
  ],
  laserWalls: [
    {
      path: [Vector3.create(20.44, 0.8, 21.1), Vector3.create(20.44, 0.8, 32.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(17.35, 0.8, 18), Vector3.create(-12.45, 0.8, 18)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-30.38, 0.8, 36), Vector3.create(17.35, 0.8, 36)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-15.57, 0.8, 14.89), Vector3.create(-15.57, 0.8, -32.90)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(17.35, 0.8, -36), Vector3.create(-12.45, 0.8, -36)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(17.35, 0.8, -18), Vector3.create(5.55, 0.8, -18)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(20.44, 0.8, -32.90), Vector3.create(20.44, 0.8, -21.1)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(2.44, 0.8, -14.9), Vector3.create(2.44, 0.8, -3.1)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    }
  ]
}
