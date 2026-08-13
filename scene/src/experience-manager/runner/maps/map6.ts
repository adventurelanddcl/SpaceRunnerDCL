import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map6: GameMap = {
  modelPath: 'models/map6.glb',
  modelPosition: Vector3.create(0, -35, 0),
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 32, 0),
  spawnPosition: Vector3.create(SCENE_CENTER, 14.2, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(48, 40, 80),
  spawnAvatarTarget: Vector3.create(48, 40, 80),
  startPosition: Vector3.create(0, -31, 0),
  startSize: Vector3.create(20, 7, 20),
  finishPosition: Vector3.create(0, 33.75, 0),
  finishSize: Vector3.create(9, 7, 9),
  swingBeams: [
    { position: Vector3.create(0, -30.8, 23), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(0, -30.8, -23), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
  ],
  boostRings: [
    { position: Vector3.create(0, -14, 0) },
  ],

  windForceV2s: [
    { position: Vector3.create(-36, -35.4, 0), strength: 45 },
    { position: Vector3.create(36, -35.4, 0), strength: 45 },
    { position: Vector3.create(0, -35.4, 36), strength: 45 },
    { position: Vector3.create(0, -35.4, -36), strength: 45 },
  ],
    boostRingGroups: [
    //Rings 1 (outer)
    [
    { position: Vector3.create(0, -6, 20) },
    { position: Vector3.create(0, 4, 20) },
    { position: Vector3.create(0, 14, 20) },
    { position: Vector3.create(0, 24, 20) },

    { position: Vector3.create(15, -6, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 4, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 14, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 24, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -6, -20) },
    { position: Vector3.create(0, 4, -20) },
    { position: Vector3.create(0, 14, -20) },
    { position: Vector3.create(0, 24, -20) },

    { position: Vector3.create(15, -6, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 4, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 14, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 24, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(20, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -6, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 4, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 14, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 24, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-20, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, -6, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 4, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 14, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 24, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 2 (middle)
    [
    { position: Vector3.create(0, -6, 12) },
    { position: Vector3.create(0, 4, 12) },
    { position: Vector3.create(0, 14, 12) },
    { position: Vector3.create(0, 24, 12) },

    { position: Vector3.create(9, -6, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 4, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 14, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 24, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -6, -12) },
    { position: Vector3.create(0, 4, -12) },
    { position: Vector3.create(0, 14, -12) },
    { position: Vector3.create(0, 24, -12) },

    { position: Vector3.create(9, -6, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 4, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 14, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 24, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(12, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -6, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 4, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 14, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 24, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-12, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -6, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 4, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 14, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 24, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 3 (inner)
    [
    { position: Vector3.create(0, -6, 4) },
    { position: Vector3.create(0, 4, 4) },
    { position: Vector3.create(0, 14, 4) },

    { position: Vector3.create(3, -6, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 4, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 14, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -6, -4) },
    { position: Vector3.create(0, 4, -4) },
    { position: Vector3.create(0, 14, -4) },

    { position: Vector3.create(3, -6, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 4, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 14, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(4, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -6, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 4, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 14, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-4, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -6, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 4, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 14, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ]
  ],


  spawningPlatformPaths: {
    start: [
    { position: Vector3.create(0, -36.25, 13) },
    { position: Vector3.create(0, -36.25, -13) },
    { position: Vector3.create(13, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-13, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, -90, 0) },
    ],
    platforms: [
    { position: Vector3.create(0, -36.25, 18) },
    { position: Vector3.create(0, -36.25, 23) },
    { position: Vector3.create(0, -36.25, 28) },
    { position: Vector3.create(0, -36.25, 33) },

    { position: Vector3.create(0, -36.25, -18) },
    { position: Vector3.create(0, -36.25, -23) },
    { position: Vector3.create(0, -36.25, -28) },
    { position: Vector3.create(0, -36.25, -33) },

    { position: Vector3.create(18, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(23, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(28, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(33, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-18, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, -90, 0) },
    { position: Vector3.create(-23, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, -90, 0) },
    { position: Vector3.create(-28, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, -90, 0) },
    { position: Vector3.create(-33, -36.25, 0), rotation: Quaternion.fromEulerDegrees(0, -90, 0) },
    ]
  },
  gliderMines: [
    { position: Vector3.create(-22, -15, 0) },
    { position: Vector3.create(22, 0, 0) },
    { position: Vector3.create(0, 15, -22) },
    { position: Vector3.create(0, 30, 22) },
  ],
  collapsingPlatforms: [
    // --- Ring 0: Outermost Border (Y = -20) ---
    { position: Vector3.create(-20, -20, -20) },
    { position: Vector3.create(-20, -20, -15) },
    { position: Vector3.create(-20, -20, -10) },
    { position: Vector3.create(-20, -20, -5) },
    { position: Vector3.create(-20, -20, 0) },
    { position: Vector3.create(-20, -20, 5) },
    { position: Vector3.create(-20, -20, 10) },
    { position: Vector3.create(-20, -20, 15) },
    { position: Vector3.create(-20, -20, 20) },
    { position: Vector3.create(-15, -20, -20) },
    { position: Vector3.create(-15, -20, 20) },
    { position: Vector3.create(-10, -20, -20) },
    { position: Vector3.create(-10, -20, 20) },
    { position: Vector3.create(-5, -20, -20) },
    { position: Vector3.create(-5, -20, 20) },
    { position: Vector3.create(0, -20, -20) },
    { position: Vector3.create(0, -20, 20) },
    { position: Vector3.create(5, -20, -20) },
    { position: Vector3.create(5, -20, 20) },
    { position: Vector3.create(10, -20, -20) },
    { position: Vector3.create(10, -20, 20) },
    { position: Vector3.create(15, -20, -20) },
    { position: Vector3.create(15, -20, 20) },
    { position: Vector3.create(20, -20, -20) },
    { position: Vector3.create(20, -20, -15) },
    { position: Vector3.create(20, -20, -10) },
    { position: Vector3.create(20, -20, -5) },
    { position: Vector3.create(20, -20, 0) },
    { position: Vector3.create(20, -20, 5) },
    { position: Vector3.create(20, -20, 10) },
    { position: Vector3.create(20, -20, 15) },
    { position: Vector3.create(20, -20, 20) },

    // --- Ring 1: Inner Shell 1 (Y = -17.5) ---
    { position: Vector3.create(-15, -18, -15) },
    { position: Vector3.create(-15, -18, -10) },
    { position: Vector3.create(-15, -18, -5) },
    { position: Vector3.create(-15, -18, 0) },
    { position: Vector3.create(-15, -18, 5) },
    { position: Vector3.create(-15, -18, 10) },
    { position: Vector3.create(-15, -18, 15) },
    { position: Vector3.create(-10, -18, -15) },
    { position: Vector3.create(-10, -18, 15) },
    { position: Vector3.create(-5, -18, -15) },
    { position: Vector3.create(-5, -18, 15) },
    { position: Vector3.create(0, -18, -15) },
    { position: Vector3.create(0, -18, 15) },
    { position: Vector3.create(5, -18, -15) },
    { position: Vector3.create(5, -18, 15) },
    { position: Vector3.create(10, -18, -15) },
    { position: Vector3.create(10, -18, 15) },
    { position: Vector3.create(15, -18, -15) },
    { position: Vector3.create(15, -18, -10) },
    { position: Vector3.create(15, -18, -5) },
    { position: Vector3.create(15, -18, 0) },
    { position: Vector3.create(15, -18, 5) },
    { position: Vector3.create(15, -18, 10) },
    { position: Vector3.create(15, -18, 15) },

    // --- Ring 2: Inner Shell 2 (Y = -15) ---
    { position: Vector3.create(-10, -16, -10) },
    { position: Vector3.create(-10, -16, -5) },
    { position: Vector3.create(-10, -16, 0) },
    { position: Vector3.create(-10, -16, 5) },
    { position: Vector3.create(-10, -16, 10) },
    { position: Vector3.create(-5, -16, -10) },
    { position: Vector3.create(-5, -16, 10) },
    { position: Vector3.create(0, -16, -10) },
    { position: Vector3.create(0, -16, 10) },
    { position: Vector3.create(5, -16, -10) },
    { position: Vector3.create(5, -16, 10) },
    { position: Vector3.create(10, -16, -10) },
    { position: Vector3.create(10, -16, -5) },
    { position: Vector3.create(10, -16, 0) },
    { position: Vector3.create(10, -16, 5) },
    { position: Vector3.create(10, -16, 10) },

  ],
  laserWalls: [
    {
      path: [Vector3.create(11.45, -35.8, 0), Vector3.create(38.2, -35.8, 0)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    
    {
      path: [Vector3.create(-11.45, -35.8, 0), Vector3.create(-38.2, -35.8, 0)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },

    {
      path: [Vector3.create(26.9, -21, 29.925), Vector3.create(-26.9, -21, 29.925)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(26.9, -21, -29.925), Vector3.create(-26.9, -21, -29.925)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(30, -21, 26.9), Vector3.create(30, -21, -26.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-30, -21, 26.9), Vector3.create(-30, -21, -26.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    
  ],
  bounceStands: [
    { position: Vector3.create(17.933, -21.0, 29.925) },
    { position: Vector3.create(8.967, -21.0, 29.925) },
    { position: Vector3.create(0.0, -21.0, 29.925) },
    { position: Vector3.create(-8.967, -21.0, 29.925) },
    { position: Vector3.create(-17.933, -21.0, 29.925) },

    { position: Vector3.create(17.933, -21.0, -29.925) },
    { position: Vector3.create(8.967, -21.0, -29.925) },
    { position: Vector3.create(0.0, -21.0, -29.925) },
    { position: Vector3.create(-8.967, -21.0, -29.925) },
    { position: Vector3.create(-17.933, -21.0, -29.925) },

    { position: Vector3.create(30.0, -21.0, 17.933) },
    { position: Vector3.create(30.0, -21.0, 8.967) },
    { position: Vector3.create(30.0, -21.0, 0.0) },
    { position: Vector3.create(30.0, -21.0, -8.967) },
    { position: Vector3.create(30.0, -21.0, -17.933) },

    { position: Vector3.create(-30.0, -21.0, 17.933) },
    { position: Vector3.create(-30.0, -21.0, 8.967) },
    { position: Vector3.create(-30.0, -21.0, 0.0) },
    { position: Vector3.create(-30.0, -21.0, -8.967) },
    { position: Vector3.create(-30.0, -21.0, -17.933) },
  ],
  bounceTraps: [
    { position: Vector3.create(-30, -21, 30) },
    { position: Vector3.create(-30, -21, -30) },
    { position: Vector3.create(30, -21, -30) },
    { position: Vector3.create(30, -21, 30) },

  ],
}
