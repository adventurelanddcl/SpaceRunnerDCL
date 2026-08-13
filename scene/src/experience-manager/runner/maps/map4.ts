import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map4: GameMap = {
  modelPath: 'models/map4.glb',
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 20, 0),
  spawnPosition: Vector3.create(SCENE_CENTER, SCENE_CENTER-0.25, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(12, 40, 48),
  spawnAvatarTarget: Vector3.create(12, 40, 48),
  startPosition: Vector3.create(0, 3.5, 0),
  startSize: Vector3.create(20, 7, 20),
  finishPosition: Vector3.create(0, 26, 0),
  finishSize: Vector3.create(9, 7, 9),
  windForceV3s: [
    { position: Vector3.create(-18, -20, -18), strength: 45 },
    { position: Vector3.create(-18, -20, 18), strength: 45 },
    { position: Vector3.create(18, -20, 18), strength: 45 },
    { position: Vector3.create(18, -20, -18), strength: 45 },
  ],
  ballTraps: [
    {
      path: [Vector3.create(-30, 2.2, -30), Vector3.create(-30, 2.2, 30)],
      speed: 12
    },
    {
      path: [Vector3.create(30, 2.2, 30), Vector3.create(30, 2.2, -30)],
      speed: 12
    }
  ],
   bounceStands: [
    { position: Vector3.create(25, -0.95, 30) },
    { position: Vector3.create(16.67, -0.95, 30) },
    { position: Vector3.create(8.33, -0.95, 30) },
    { position: Vector3.create(0.00, -0.95, 30) },
    { position: Vector3.create(-8.33, -0.95, 30) },
    { position: Vector3.create(-16.67, -0.95, 30) },
    { position: Vector3.create(-25, -0.95, 30) },

    { position: Vector3.create(25, -0.95, -30) },
    { position: Vector3.create(16.67, -0.95, -30) },
    { position: Vector3.create(8.33, -0.95, -30) },
    { position: Vector3.create(0.00, -0.95, -30) },
    { position: Vector3.create(-8.33, -0.95, -30) },
    { position: Vector3.create(-16.67, -0.95, -30) },
    { position: Vector3.create(-25, -0.95, -30) },
  ],
    laserWalls: [
    {
      path: [Vector3.create(26.9, -0.95, 29.9), Vector3.create(3, -0.95, 29.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-26.9, -0.95, 29.9), Vector3.create(-3, -0.95, 29.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(26.9, -0.95, -30.1), Vector3.create(3, -0.95, -30.1)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },


    {
      path: [Vector3.create(-26.9, -0.95, -30.1), Vector3.create(-3, -0.95, -30.1)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },

    {
      path: [Vector3.create(0, -0.95, 26.8), Vector3.create(0, -0.95, 11.4)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(0, -0.95, -26.8), Vector3.create(0, -0.95, -11.4)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },

  ],
  spawningPlatformPaths: {
    start: [
    { position: Vector3.create(14, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-14, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(0, -1.25, 14), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(0, -1.25, -14), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    ],
    platforms: [
    { position: Vector3.create(19, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(24, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-19, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-24, -1.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(0, -1.25, 19), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(0, -1.25, 24), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    { position: Vector3.create(0, -1.25, -19), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(0, -1.25, -24), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    ]
  },

  swingBeams: [
    { position: Vector3.create(19, 4.25, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-19, 4.25, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
  ],

  collapsingPlatforms: [

    { position: Vector3.create(15, -1.25, 8) },
    { position: Vector3.create(22, -1.25, 8) },

    { position: Vector3.create(8, -1.25, 15) },
    { position: Vector3.create(15, -1.25, 15) },
    { position: Vector3.create(22, -1.25, 15) },

    { position: Vector3.create(8, -1.25, 22) },
    { position: Vector3.create(15, -1.25, 22) },
    { position: Vector3.create(22, -1.25, 22) },


    { position: Vector3.create(15, -1.25, -8) },
    { position: Vector3.create(22, -1.25, -8) },

    { position: Vector3.create(8, -1.25, -15) },
    { position: Vector3.create(15, -1.25, -15) },
    { position: Vector3.create(22, -1.25, -15) },

    { position: Vector3.create(8, -1.25, -22) },
    { position: Vector3.create(15, -1.25, -22) },
    { position: Vector3.create(22, -1.25, -22) },



    { position: Vector3.create(-8, -1.25, -15) },
    { position: Vector3.create(-8, -1.25, -22) },

    { position: Vector3.create(-15, -1.25, -8) },
    { position: Vector3.create(-15, -1.25, -15) },
    { position: Vector3.create(-15, -1.25, -22) },

    { position: Vector3.create(-22, -1.25, -8) },
    { position: Vector3.create(-22, -1.25, -15) },
    { position: Vector3.create(-22, -1.25, -22) },


    { position: Vector3.create(-8, -1.25, 15) },
    { position: Vector3.create(-8, -1.25, 22) },

    { position: Vector3.create(-15, -1.25, 8) },
    { position: Vector3.create(-15, -1.25, 15) },
    { position: Vector3.create(-15, -1.25, 22) },

    { position: Vector3.create(-22, -1.25, 8) },
    { position: Vector3.create(-22, -1.25, 15) },
    { position: Vector3.create(-22, -1.25, 22) },


  ],

  spawningPlatformUPs: [
    { position: Vector3.create(10, -1.25, 10), showPointerArrow: true, maxBlockHeight: 26, maxDistance: 6, boundary: 6 },
    { position: Vector3.create(10, -1.25, -10), showPointerArrow: true, maxBlockHeight: 26, maxDistance: 6, boundary: 6 },
    { position: Vector3.create(-10, -1.25, 10), showPointerArrow: true, maxBlockHeight: 26, maxDistance: 6, boundary: 6 },
    { position: Vector3.create(-10, -1.25, -10), showPointerArrow: true, maxBlockHeight: 26, maxDistance: 6, boundary: 6 },



  ],






}
