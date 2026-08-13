import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map9: GameMap = {
  modelPath: 'models/map9.glb',
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 30, 0),


  spawnPosition: Vector3.create(84, SCENE_CENTER + 0.75, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(38.75, 3.2, 0),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(-38.75, 2.5, 0),
  finishSize: Vector3.create(11, 7, 12),

  windForceV3s: [
    { position: Vector3.create(22.5, -20, 9), strength: 45 },
    { position: Vector3.create(22.5, -20, -9), strength: 45 },

    { position: Vector3.create(7.5, -20, -9), strength: 45 },
    { position: Vector3.create(7.5, -20, 9), strength: 45 },

    { position: Vector3.create(-22.5, -20, 9), strength: 45 },
    { position: Vector3.create(-22.5, -20, -9), strength: 45 },

    { position: Vector3.create(-7.5, -20, -9), strength: 45 },
    { position: Vector3.create(-7.5, -20, 9), strength: 45 },
  ],


  meteors: [
    {
      position: Vector3.create(0, -45, 0),      // area centre, at ground height
      areaSize: Vector3.create(30, 0, 30),    // strikes land within ±15 on X/Z
      interval: 5,                            // seconds between strikes
      warningTime: 1.5,                       // telegraph time
      impactRadius: 3,                        // ring + damage radius
      fallHeight: 80,                         // spawn height above the area
      fallSpeed: 25
    }
  ],

  enemies: [
    {
      position: Vector3.create(0, 3, 0),    // patrol area centre, ground height
      areaSize: Vector3.create(30, 0, 30),  // wanders within ±10 on X/Z
      speed: 3,                             // patrol pace
      detectRadius: 10,                     // awareness zone half-extent
      chargeSpeed: 12,                      // ram speed
      alertTime: 1.5,                       // dodge window
      knockback: 25
    }
  ],

  laserMazeWalls: [
    { position: Vector3.create(30, 3.7, 0), length: 23 },
    { position: Vector3.create(-30, 3.7, 0), length: 23 },
    { position: Vector3.create(0, 3.7, 30), length: 23, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(0, 3.7, -30), length: 23, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
  ],

  laserMazeVerticals: [
    {
      path: [Vector3.create(29.5, -7, 0), Vector3.create(-29.5, -7, 0)],
      height: 15,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-29.5, -7, 18), Vector3.create(29.5, -7, 18)],
      height: 15,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },    
    {
      path: [Vector3.create(-29.5, -7, -18), Vector3.create(29.5, -7, -18)],
      height: 15,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },    
  ],

    spawningPlatformPaths: {
    start: [


    { position: Vector3.create(22.5, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(22.5, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(22.5, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(7.5, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(7.5, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(7.5, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },


    { position: Vector3.create(-22.5, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-22.5, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-22.5, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-7.5, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-7.5, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-7.5, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    ],
    platforms: [
    { position: Vector3.create(15, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    
    { position: Vector3.create(15, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(15, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(15, 0.5, 11.5) },
    { position: Vector3.create(15, 0.5, 6.5) },

    { position: Vector3.create(15, 0.5, -11.5) },
    { position: Vector3.create(15, 0.5, -6.5) },

    { position: Vector3.create(-15, 0.5, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    
    { position: Vector3.create(-15, 0.5, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, 0.5, -18), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, 0.5, 11.5) },
    { position: Vector3.create(-15, 0.5, 6.5) },

    { position: Vector3.create(-15, 0.5, -11.5) },
    { position: Vector3.create(-15, 0.5, -6.5) },
    ]
  },
      laserWalls: [

    {
      path: [Vector3.create(30, 0.8, -3.1), Vector3.create(30, 0.8, -15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(30, 0.8, 3.1), Vector3.create(30, 0.8, 15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(0, 0.8, -3.1), Vector3.create(0, 0.8, -15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(0, 0.8, 3.1), Vector3.create(0, 0.8, 15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-30, 0.8, -3.1), Vector3.create(-30, 0.8, -15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-30, 0.8, 3.1), Vector3.create(-30, 0.8, 15)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },

    {
      path: [Vector3.create(26.9, 0.8, -30), Vector3.create(3.1, 0.8, -30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-26.9, 0.8, -30), Vector3.create(-3.1, 0.8, -30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(26.9, 0.8, 30), Vector3.create(3.1, 0.8, 30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-26.9, 0.8, 30), Vector3.create(-3.1, 0.8, 30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
  ],

  swingBeams: [
    { position: Vector3.create(18.75, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(11.25, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    { position: Vector3.create(-18.75, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-11.25, 6, 0), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    { position: Vector3.create(18.75, 6, 18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(11.25, 6, 18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    
    { position: Vector3.create(-18.75, 6, 18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-11.25, 6, 18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },

    { position: Vector3.create(18.75, 6, -18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(11.25, 6, -18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    
    { position: Vector3.create(-18.75, 6, -18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
    { position: Vector3.create(-11.25, 6, -18), rotation: Quaternion.fromEulerDegrees(0, 0, 0) },
  ],

}
