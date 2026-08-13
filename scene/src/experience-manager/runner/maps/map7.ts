import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map7: GameMap = {
  modelPath: 'models/map7.glb',
  modelPosition: Vector3.create(0, -35, 0),
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 32, 0),
  spawnPosition: Vector3.create(SCENE_CENTER, 14.2, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(26, 20, 48),
  spawnAvatarTarget: Vector3.create(26, 20, 48),
  startPosition: Vector3.create(0, -31, 0),
  startSize: Vector3.create(20, 7, 20),
  finishPosition: Vector3.create(0, 33.75, 0),
  finishSize: Vector3.create(9, 7, 9),

  windForceV2s: [
    { position: Vector3.create(-20, -34.2, -18), strength: 40 },
    { position: Vector3.create(0, -16, 0), strength: 40 },
  ],
    bounceStands: [
    { position: Vector3.create(-20, -34.2, 9) },

    { position: Vector3.create(-14, -34.2, 18) },
    { position: Vector3.create(-8, -34.2, 18) },
    { position: Vector3.create(-2, -34.2, 18) },
    { position: Vector3.create(4, -34.2, 18) },
    { position: Vector3.create(10, -34.2, 18) },

    { position: Vector3.create(16, -34.2, 12) },
    { position: Vector3.create(16, -34.2, 6) },
    { position: Vector3.create(16, -34.2, 0) },
    { position: Vector3.create(16, -34.2, -6) },
    { position: Vector3.create(16, -34.2, -12) },

    { position: Vector3.create(10, -34.2, -18) },
    { position: Vector3.create(4, -34.2, -18) },
    { position: Vector3.create(-2, -34.2, -18) },
    { position: Vector3.create(-8, -34.2, -18) },
    { position: Vector3.create(-14, -34.2, -18) },
  ],
  bounceTraps: [
    { position: Vector3.create(-20, -34.2, 0) },
    { position: Vector3.create(-20, -34.2, 18) },

    { position: Vector3.create(16, -34.2, 18) },
    { position: Vector3.create(16, -34.2, -18) },

    { position: Vector3.create(-30, -21, -30) },
    { position: Vector3.create(0, -21, -30) },
    { position: Vector3.create(-30, -21, 30) },
    { position: Vector3.create(-30, -21, 0) },
    { position: Vector3.create(30, -21, 30) },
    { position: Vector3.create(0, -21, 30) },
    { position: Vector3.create(30, -21, -30) },
    { position: Vector3.create(30, -21, 0) },

    { position: Vector3.create(30, -21, -15) },
    { position: Vector3.create(30, -21, 15) },
    { position: Vector3.create(-30, -21, 15) },
    { position: Vector3.create(-30, -21, -15) },
    { position: Vector3.create(-15, -21, 30) },
    { position: Vector3.create(15, -21, 30) },
    { position: Vector3.create(-15, -21, -30) },
    { position: Vector3.create(15, -21, -30) },



    { position: Vector3.create(-9.5, -16, 9.5) },
    { position: Vector3.create(9.5, -16, 9.5) },
    { position: Vector3.create(9.5, -16, -9.5) },
    { position: Vector3.create(-9.5, -16, -9.5) },

    { position: Vector3.create(0, -16, -9.5) },
    { position: Vector3.create(0, -16, 9.5) },
    { position: Vector3.create(9.5, -16, 0) },
    { position: Vector3.create(-9.5, -16, 0) },



    { position: Vector3.create(5, -16, 5) },
    { position: Vector3.create(5, -16, -5) },
    { position: Vector3.create(-5, -16, 5) },
    { position: Vector3.create(-5, -16, -5) },





  ],
  laserWalls: [
    {
      path: [Vector3.create(-5, -34.2, 0), Vector3.create(-16.9, -34.2, 0)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-20, -34.2, 3.15), Vector3.create(-20, -34.2, 14.9)],
      speed: 4,
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-16.9, -34.2, 18), Vector3.create(12.9, -34.2, 18)],
      speed: 4,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(16, -34.2, 14.9), Vector3.create(16, -34.2, -14.9)],
      speed: 4,
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(12.9, -34.2, -18), Vector3.create(-22.9, -34.2, -18)],
      speed: 4,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },



  ],

  ballTraps: [
    {
      path: [Vector3.create(-30, -17.8, -30), Vector3.create(-30, -17.8, 30), Vector3.create(30, -17.8, 30), Vector3.create(30, -17.8, -30)],
      speed: 12
    }
  ],
  gliderMines: [
    { position: Vector3.create(22, 0, 0) },
    { position: Vector3.create(-22, 0, 0) },
    { position: Vector3.create(0, 15, 22) },
    { position: Vector3.create(0, 15, -22) },
    { position: Vector3.create(0, 30, 22) },
    { position: Vector3.create(0, 30, -22) },
  ],

  boostRingGroups: [
    //Rings 1 (outer)
    [
    { position: Vector3.create(0, -4, 20) },
    { position: Vector3.create(0, 6, 20) },
    { position: Vector3.create(0, 16, 20) },
    { position: Vector3.create(0, 26, 20) },

    { position: Vector3.create(15, -4, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 6, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 16, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 26, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -4, -20) },
    { position: Vector3.create(0, 6, -20) },
    { position: Vector3.create(0, 16, -20) },
    { position: Vector3.create(0, 26, -20) },

    { position: Vector3.create(15, -4, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 6, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 16, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 26, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(20, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -4, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 6, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 16, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 26, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-20, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -4, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 6, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 16, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 26, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 2 (middle)
    [
    { position: Vector3.create(0, -4, 12) },
    { position: Vector3.create(0, 6, 12) },
    { position: Vector3.create(0, 16, 12) },
    { position: Vector3.create(0, 26, 12) },

    { position: Vector3.create(9, -4, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 6, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 16, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 26, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -4, -12) },
    { position: Vector3.create(0, 6, -12) },
    { position: Vector3.create(0, 16, -12) },
    { position: Vector3.create(0, 26, -12) },

    { position: Vector3.create(9, -4, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 6, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 16, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 26, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(12, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -4, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 6, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 16, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 26, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-12, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -4, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 6, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 16, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 26, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 3 (inner)
    [
    { position: Vector3.create(0, -4, 4) },
    { position: Vector3.create(0, 6, 4) },
    { position: Vector3.create(0, 16, 4) },

    { position: Vector3.create(3, -4, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 6, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 16, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -4, -4) },
    { position: Vector3.create(0, 6, -4) },
    { position: Vector3.create(0, 16, -4) },

    { position: Vector3.create(3, -4, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 6, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 16, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(4, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -4, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 6, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 16, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-4, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -4, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 6, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 16, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ]
  ],
}
