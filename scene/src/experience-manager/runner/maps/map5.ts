import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map5: GameMap = {
  modelPath: 'models/map5.glb',
  modelPosition: Vector3.create(0, -33, 0),
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 30, 0),
  spawnPosition: Vector3.create(SCENE_CENTER, 16.2, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(48, 40, 70),
  spawnAvatarTarget: Vector3.create(48, 40, 70),
  startPosition: Vector3.create(0, -29, 0),
  startSize: Vector3.create(20, 7, 20),
  finishPosition: Vector3.create(0, 35.75, 0),
  finishSize: Vector3.create(9, 7, 9),
  gliderMines: [

    { position: Vector3.create(-22, -15, 0) },
    { position: Vector3.create(22, 5, 0) },
    { position: Vector3.create(-22, 25, 22) },
  ],

  windForceV2s: [
    { position: Vector3.create(24, -33.7, 0), strength: 45 },
    { position: Vector3.create(-24, -33.7, 0), strength: 45 },
    { position: Vector3.create(0, -33.7, 24), strength: 45 },
    { position: Vector3.create(0, -33.7, -24), strength: 45 },
  ],
  boostRingGroups: [
    //Rings 1 (outer)
    [
    { position: Vector3.create(0, -24, 20) },
    { position: Vector3.create(0, -14, 20) },
    { position: Vector3.create(0, -4, 20) },
    { position: Vector3.create(0, 6, 20) },
    { position: Vector3.create(0, 16, 20) },
    { position: Vector3.create(0, 26, 20) },

    { position: Vector3.create(15, -24, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, -14, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, -4, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 6, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 16, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 26, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -24, -20) },
    { position: Vector3.create(0, -14, -20) },
    { position: Vector3.create(0, -4, -20) },
    { position: Vector3.create(0, 6, -20) },
    { position: Vector3.create(0, 16, -20) },
    { position: Vector3.create(0, 26, -20) },

    { position: Vector3.create(15, -24, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, -14, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, -4, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 6, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 16, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 26, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(20, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -24, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, -14, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, -4, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 6, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 16, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 26, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-20, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -24, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, -14, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, -4, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 6, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 16, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 26, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 2 (middle)
    [
    { position: Vector3.create(0, -24, 12) },
    { position: Vector3.create(0, -14, 12) },
    { position: Vector3.create(0, -4, 12) },
    { position: Vector3.create(0, 6, 12) },
    { position: Vector3.create(0, 16, 12) },
    { position: Vector3.create(0, 26, 12) },

    { position: Vector3.create(9, -24, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, -14, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, -4, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 6, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 16, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 26, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -24, -12) },
    { position: Vector3.create(0, -14, -12) },
    { position: Vector3.create(0, -4, -12) },
    { position: Vector3.create(0, 6, -12) },
    { position: Vector3.create(0, 16, -12) },
    { position: Vector3.create(0, 26, -12) },

    { position: Vector3.create(9, -24, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, -14, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, -4, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 6, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 16, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 26, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(12, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -24, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, -14, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, -4, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 6, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 16, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 26, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-12, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -24, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, -14, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, -4, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 6, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 16, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 26, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 3 (inner)
    [
    { position: Vector3.create(0, -24, 4) },
    { position: Vector3.create(0, -14, 4) },
    { position: Vector3.create(0, -4, 4) },
    { position: Vector3.create(0, 6, 4) },
    { position: Vector3.create(0, 16, 4) },

    { position: Vector3.create(3, -24, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, -14, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, -4, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 6, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 16, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -24, -4) },
    { position: Vector3.create(0, -14, -4) },
    { position: Vector3.create(0, -4, -4) },
    { position: Vector3.create(0, 6, -4) },
    { position: Vector3.create(0, 16, -4) },

    { position: Vector3.create(3, -24, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, -14, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, -4, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 6, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 16, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(4, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -24, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, -14, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, -4, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 6, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 16, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-4, -24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, -14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, -4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -24, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, -14, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, -4, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 6, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 16, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ]
  ]
}
