import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map8: GameMap = {
  modelPath: 'models/map8.glb',
  modelPosition: Vector3.create(0, -20, 0),
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 30, 0),
  spawnPosition: Vector3.create(48, 29, 82),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(0, -16, 33.5),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(3, 36, -31.75),
  finishSize: Vector3.create(11, 7, 12),


  spawningPlatformPaths: {
    start: [
    { position: Vector3.create(22, -18.5, -29.5), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-25.2, 10, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    ],
    platforms: [
    { position: Vector3.create(17, -17, -29.5), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, -15.5, -29.5), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-25.2, 11.5, 5), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-25.2, 13, 10), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-25.2, 14.5, 15), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-25.2, 16, 20), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-25.2, 17.5, 25), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    ]
  },

  collapsingPlatforms: [
    { position: Vector3.create(-20, 17.5, 25) },
    { position: Vector3.create(-15, 17.5, 25) },
    { position: Vector3.create(-10, 17.5, 25) },
    { position: Vector3.create(-5, 17.5, 25) },
    { position: Vector3.create(0, 17.5, 25) },
    { position: Vector3.create(5, 17.5, 25) },
    { position: Vector3.create(5, 17.5, 20) },
    { position: Vector3.create(5, 17.5, 15) },
    { position: Vector3.create(5, 17.5, 10) },
    { position: Vector3.create(5, 17.5, 5) },
    { position: Vector3.create(10, 17.5, 5) },
    { position: Vector3.create(15, 17.5, 5) },

  ],


  spikeBeams: [
    {
      path: [Vector3.create(15.25, -16.25, 3.5), Vector3.create(20.75, -16.25, 3.5)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(3.1, -16.25, 21), Vector3.create(3.1, -16.25, 16)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(14.9, -16.25, 21), Vector3.create(14.9, -16.25, 16)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    }    ,
    {
      path: [Vector3.create(21.1, -16.25, -2.1), Vector3.create(21.1, -16.25, 3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(32.9, -16.25, -2.1), Vector3.create(32.9, -16.25, 3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(38.5, -16.25, -2.7), Vector3.create(33.2, -16.25, -2.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(38.5, -16.25, -26.5), Vector3.create(33.2, -16.25, -26.5)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(33, -16.25, -32.1), Vector3.create(33, -16.25, -26.9)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },


    {
      path: [Vector3.create(13.8, 11.45, -26.4), Vector3.create(19.5, 11.45, -26.4)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(13.7, 11.45, -26.8), Vector3.create(13.7, 11.45, -32.3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
        {
      path: [Vector3.create(-4.2, 11.45, -26.8), Vector3.create(-4.2, 11.45, -32.3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-4.6, 11.45, -26.5), Vector3.create(-10, 11.45, -26.4)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-4.6, 11.45, -14.6), Vector3.create(-10, 11.45, -14.6)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-10.4, 11.45, -14.3), Vector3.create(-10.4, 11.45, -8.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-22.2, 11.45, -8.8), Vector3.create(-22.2, 11.45, -14.3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-22.5, 11.45, -8.5), Vector3.create(-28, 11.45, -8.5)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
  ],
  
  laserMazeWalls: [
    { position: Vector3.create(7.5, -10.55, -29.5), length: 3 },

    { position: Vector3.create(-1.2, -10.55, -26), length: 3, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-1.2, -10.55, -15.1), length: 3, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4.8, -10.55, -11.5), length: 3 },
    { position: Vector3.create(-21.7, -10.55, -11.5), length: 3 },
    { position: Vector3.create(-25.3, -10.55, -8), length: 3, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
  ],


  laserWalls: [
    {
      path: [Vector3.create(-1.25, -13.5, -26.45), Vector3.create(-1.25, -13.5, -14.75)],
      speed: 4, // 23.8m in 6s (matches the old segmentDuration: 6000)
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-4.4, -13.5, -11.575), Vector3.create(-22.15, -13.5, -11.575)],
      speed: 4, // 23.8m in 6s (matches the old segmentDuration: 6000)
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
  ],

  spikePlates: [
    {
      path: [
        Vector3.create(0, -20, 18.5),
        Vector3.create(18, -20, 18.5),
        Vector3.create(18, -20, 0.5),
        Vector3.create(26.5, -20, 0.5),
        Vector3.create(36, -20, 0.5),
        Vector3.create(36, -20, -29.5),

        Vector3.create(36, -20, 0.5),
        Vector3.create(26.5, -20, 0.5),
        Vector3.create(18, -20, 0.5),
        Vector3.create(18, -20, 18.5),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(33.1, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, 31.4),
        Vector3.create(33.1, 31.5, 31.4),
      ],
      speed: 5,
      safeTime: 2     
    },
    {
      path: [
        Vector3.create(-26.9, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, 31.4),
        Vector3.create(33.1, 31.5, 31.4),
        Vector3.create(33.1, 31.5, -16.6),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-26.9, 31.5, 31.4),
        Vector3.create(33.1, 31.5, 31.4),
        Vector3.create(33.1, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, -16.6),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(33.1, 31.5, 31.4),
        Vector3.create(33.1, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, -16.6),
        Vector3.create(-26.9, 31.5, 31.4),
      ],
      speed: 5,
      safeTime: 2      
    },
  ],

  enemies: [
    {
      position: Vector3.create(0, 34, 0),    // patrol area centre, ground height
      areaSize: Vector3.create(30, 0, 30),  // wanders within ±10 on X/Z
      speed: 3,                             // patrol pace
      detectRadius: 10,                     // awareness zone half-extent
      chargeSpeed: 12,                      // ram speed
      alertTime: 1.5,                       // dodge window
      knockback: 25
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

  windForceV2s: [
    { position: Vector3.create(-25.3, -13.5, 8), strength: 35 },
    { position: Vector3.create(16.7, -3.2, -10.8), strength: 35 }, 
    { position: Vector3.create(23, 20, 5), strength: 35 }, 

    { position: Vector3.create(0, -35, 0), strength: 35 }, 
  ],


  bounceTraps: [
    { position: Vector3.create(-25.2, -3.2, 19.7) },
    { position: Vector3.create(-25.2, -3.2, 25.7) },
    { position: Vector3.create(-19.2, -3.2, 25.7) },
    { position: Vector3.create(-13.2, -3.2, 25.7) },
    { position: Vector3.create(-7.2, -3.2, 25.7) },
    { position: Vector3.create(-1.2, -3.2, 25.7) },
    { position: Vector3.create(-1.2, -3.2, 19.7) },
    { position: Vector3.create(-1.2, -3.2, 13.7) },
    { position: Vector3.create(-1.2, -3.2, 7.7) },
    { position: Vector3.create(4.8, -3.2, 7.7) },
    { position: Vector3.create(10.8, -3.2, 7.7) },
    { position: Vector3.create(16.8, -3.2, 7.7) },
    { position: Vector3.create(16.8, -3.2, 1.7) },

  ],

  bounceStands: [
    { position: Vector3.create(-25.2, -3.2, 22.7) },

    { position: Vector3.create(-22.2, -3.2, 25.7) },
    { position: Vector3.create(-16.2, -3.2, 25.7) },
    { position: Vector3.create(-10.2, -3.2, 25.7) },
    { position: Vector3.create(-4.2, -3.2, 25.7) },

    { position: Vector3.create(-1.2, -3.2, 22.7) },
    { position: Vector3.create(-1.2, -3.2, 16.7) },
    { position: Vector3.create(-1.2, -3.2, 10.7) },

    { position: Vector3.create(1.7, -3.2, 7.7) },
    { position: Vector3.create(7.7, -3.2, 7.7) },
    { position: Vector3.create(13.7, -3.2, 7.7) },

    { position: Vector3.create(16.7, -3.2, 4.7) },

  ],
  
  ballTraps: [
    {
      path: [Vector3.create(-27, 35.5, 31.5), Vector3.create(33, 35.5, 31.5), Vector3.create(33, 35.5, -16.5), Vector3.create(-27, 35.5, -16.5)],
      speed: 12
    }
  ],


}
