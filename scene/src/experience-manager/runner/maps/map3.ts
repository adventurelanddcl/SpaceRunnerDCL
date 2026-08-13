import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map3: GameMap = {
  modelPath: 'models/map3.glb',
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 20, 0),
  spawnPosition: Vector3.create(84, SCENE_CENTER + 0.75, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(35, 3.2, 0),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(-36.2, 3.2, 0),
  finishSize: Vector3.create(11, 7, 12),
  windForceV3s: [
    { position: Vector3.create(-7, -20, -17.5), strength: 45 },
    { position: Vector3.create(-7, -20, 17.5), strength: 45 },
  ],
  swingBeams: [
    { position: Vector3.create(-21, 6, -20), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(8, 6, -20), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(8, 6, 20), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-21, 6, 20), rotation: Quaternion.fromEulerDegrees(0, 90, 0) }
  ],
  spawningPlatformPaths: {
    start: [
    { position: Vector3.create(27, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    ],
    platforms: [
    { position: Vector3.create(22, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(17, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(7, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(2, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-3, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-8, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-13, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-18, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-23, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-28, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },


    { position: Vector3.create(8.45, 0.5, 31) },
    { position: Vector3.create(8.45, 0.5, 26) },
    { position: Vector3.create(8.45, 0.5, 21) },
    { position: Vector3.create(8.45, 0.5, 16) },
    { position: Vector3.create(8.45, 0.5, 11) },
    { position: Vector3.create(8.45, 0.5, 6) },


    { position: Vector3.create(-21.55, 0.5, 31) },
    { position: Vector3.create(-21.55, 0.5, 26) },
    { position: Vector3.create(-21.55, 0.5, 21) },
    { position: Vector3.create(-21.55, 0.5, 16) },
    { position: Vector3.create(-21.55, 0.5, 11) },
    { position: Vector3.create(-21.55, 0.5, 6) },


    { position: Vector3.create(-21.55, 0.5, -31) },
    { position: Vector3.create(-21.55, 0.5, -26) },
    { position: Vector3.create(-21.55, 0.5, -21) },
    { position: Vector3.create(-21.55, 0.5, -16) },
    { position: Vector3.create(-21.55, 0.5, -11) },
    { position: Vector3.create(-21.55, 0.5, -6) },


    { position: Vector3.create(8.45, 0.5, -31) },
    { position: Vector3.create(8.45, 0.5, -26) },
    { position: Vector3.create(8.45, 0.5, -21) },
    { position: Vector3.create(8.45, 0.5, -16) },
    { position: Vector3.create(8.45, 0.5, -11) },
    { position: Vector3.create(8.45, 0.5, -6) },


    { position: Vector3.create(9.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-0.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-5.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-10.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-15.5, 0.5, 36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-21.5, 0.5, 36) },


    { position: Vector3.create(9.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-0.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-5.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-10.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-15.5, 0.5, -36), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-21.5, 0.5, -36) },
    ]
  },

    laserWalls: [
    {
      path: [Vector3.create(5.35, 0.8, 0), Vector3.create(-18.45, 0.8, 0)],
      speed: 4, // 23.8m in 6s (matches the old segmentDuration: 6000)
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(5.35, 0.8, 36), Vector3.create(-18.45, 0.8, 36)],
      speed: 4, // 23.8m in 6s (matches the old segmentDuration: 6000)
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(5.35, 0.8, -36), Vector3.create(-18.45, 0.8, -36)],
      speed: 4, // 23.8m in 6s (matches the old segmentDuration: 6000)
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
  ]
}
