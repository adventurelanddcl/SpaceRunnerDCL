import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map10: GameMap = {
  modelPath: 'models/map10.glb',
  modelPosition: Vector3.create(0, -33, 0),
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 35, 0),
  spawnPosition: Vector3.create(86, 19, 48),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(35.75, -29, 0),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(0, 36, 0),
  finishSize: Vector3.create(9, 7, 9),
  windForceV2s: [
    { position: Vector3.create(0, -42, 0), strength: 35 },
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
      position: Vector3.create(0, -10, 0),    // patrol area centre, ground height
      areaSize: Vector3.create(30, 0, 30),  // wanders within ±10 on X/Z
      speed: 3,                             // patrol pace
      detectRadius: 10,                     // awareness zone half-extent
      chargeSpeed: 12,                      // ram speed
      alertTime: 1.5,                       // dodge window
      knockback: 25
    }
  ],

  spikePlates: [
    {
      path: [
        Vector3.create(9, -33, -9),
        Vector3.create(9, -33, 9),
        Vector3.create(-9, -33, 9),
        Vector3.create(-9, -33, -9)
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(9, -33, 9),
        Vector3.create(-9, -33, 9),
        Vector3.create(-9, -33, -9),
        Vector3.create(9, -33, -9)
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-9, -33, 9),
        Vector3.create(-9, -33, -9),
        Vector3.create(9, -33, -9),
        Vector3.create(9, -33, 9)
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-9, -33, -9),
        Vector3.create(9, -33, -9),
        Vector3.create(9, -33, 9),
        Vector3.create(-9, -33, 9)
      ],
      speed: 5,
      safeTime: 2      
    },


    {
      path: [
        Vector3.create(18, -13, 18),
        Vector3.create(18, -13, -18),
        Vector3.create(-18, -13, -18),
        Vector3.create(-18, -13, 18),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(18, -13, -18),
        Vector3.create(-18, -13, -18),
        Vector3.create(-18, -13, 18),
        Vector3.create(18, -13, 18),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-18, -13, -18),
        Vector3.create(-18, -13, 18),
        Vector3.create(18, -13, 18),
        Vector3.create(18, -13, -18),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-18, -13, 18),
        Vector3.create(18, -13, 18),
        Vector3.create(18, -13, -18),
        Vector3.create(-18, -13, -18),
      ],
      speed: 5,
      safeTime: 2      
    },


    {
      path: [
        Vector3.create(-30, 7, -30),
        Vector3.create(30, 7, -30),
        Vector3.create(30, 7, 30),
        Vector3.create(-30, 7, 30),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(-30, 7, 30),
        Vector3.create(-30, 7, -30),
        Vector3.create(30, 7, -30),
        Vector3.create(30, 7, 30),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(30, 7, 30),
        Vector3.create(-30, 7, 30),
        Vector3.create(-30, 7, -30),
        Vector3.create(30, 7, -30),
      ],
      speed: 5,
      safeTime: 2      
    },
    {
      path: [
        Vector3.create(30, 7, -30),
        Vector3.create(30, 7, 30),
        Vector3.create(-30, 7, 30),
        Vector3.create(-30, 7, -30),
      ],
      speed: 5,
      safeTime: 2      
    },
  ],

  ballTraps: [
    {
      path: [Vector3.create(9, -29, -9), Vector3.create(-9, -29, -9), Vector3.create(-9, -29, 9), Vector3.create(9, -29, 9)],
      speed: 12
    }
  ],

  laserWalls: [
    {
      path: [Vector3.create(30, 7.8, -26.9), Vector3.create(30, 7.8, 26.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-30, 7.8, -26.9), Vector3.create(-30, 7.8, 26.9)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(-26.9, 7.8, 30), Vector3.create(26.9, 7.8, 30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-26.9, 7.8, -30), Vector3.create(26.9, 7.8, -30)],
      speed: 4, 
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },    
  ],

  laserMazeWalls: [
    { position: Vector3.create(30, 10.7, 0), length: 23 },
    { position: Vector3.create(-30, 10.7, 0), length: 23 },
    { position: Vector3.create(0, 10.7, 30), length: 23, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(0, 10.7, -30), length: 23, rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
  ],

  laserMazeVerticals: [
    {
      path: [Vector3.create(29.5, -45, 0), Vector3.create(-29.5, -45, 0)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      path: [Vector3.create(-29.5, -45, 18), Vector3.create(29.5, -45, 18)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },    
    {
      path: [Vector3.create(-29.5, -45, -18), Vector3.create(29.5, -45, -18)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },

    {
      path: [Vector3.create(0, -45, 29.5), Vector3.create(0, -45, -29.5)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },
    {
      path: [Vector3.create(18, -45, -29.5), Vector3.create(18, -45, 29.5)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },    
    {
      path: [Vector3.create(-18, -45, -29.5), Vector3.create(-18, -45, 29.5)],
      height: 75,
      speed: 3,
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    },    
  ],

  gliderMines: [
    { position: Vector3.create(22, 2.5, 0) },
    { position: Vector3.create(-22, 2.5, 0) },
    { position: Vector3.create(0, 17.5, 22) },
    { position: Vector3.create(0, 17.5, -22) },
    { position: Vector3.create(0, 32.5, 22) },
    { position: Vector3.create(0, 32.5, -22) },
  ],

  spikeBeams: [
    {
      path: [Vector3.create(12, -9.25, -15.3), Vector3.create(12, -9.25, -20.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(6, -11.75, -18), Vector3.create(6, -6.5, -18)],
      rotation: Quaternion.fromEulerDegrees(0, 90, 0),
      speed: 4
    },
    {
      path: [Vector3.create(0, -9.25, -20.7), Vector3.create(0, -9.25, -15.3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-6, -6.5, -18), Vector3.create(-6, -11.75, -18)],
      rotation: Quaternion.fromEulerDegrees(0, 90, 0),
      speed: 4
    },
    {
      path: [Vector3.create(-12, -9.25, -15.3), Vector3.create(-12, -9.25, -20.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },


    {
      path: [Vector3.create(12, -9.25, 15.3), Vector3.create(12, -9.25, 20.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(6, -11.75, 18), Vector3.create(6, -6.5, 18)],
      rotation: Quaternion.fromEulerDegrees(0, 90, 0),
      speed: 4
    },
    {
      path: [Vector3.create(0, -9.25, 20.7), Vector3.create(0, -9.25, 15.3)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-6, -6.5, 18), Vector3.create(-6, -11.75, 18)],
      rotation: Quaternion.fromEulerDegrees(0, 90, 0),
      speed: 4
    },
    {
      path: [Vector3.create(-12, -9.25, 15.3), Vector3.create(-12, -9.25, 20.7)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },



    {
      path: [Vector3.create(-15.3, -9.25, 12), Vector3.create(-20.7, -9.25, 12)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-18, -11.75, 6), Vector3.create(-18, -6.5, 6)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      speed: 4
    },
    {
      path: [Vector3.create(-20.7, -9.25, 0), Vector3.create(-15.3, -9.25, 0)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(-18, -6.5, -6), Vector3.create(-18, -11.75, -6)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      speed: 4
    },
    {
      path: [Vector3.create(-15.3, -9.25, -12), Vector3.create(-20.7, -9.25, -12)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },


    {
      path: [Vector3.create(15.3, -9.25, 12), Vector3.create(20.7, -9.25, 12)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(18, -11.75, 6), Vector3.create(18, -6.5, 6)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      speed: 4
    },
    {
      path: [Vector3.create(20.7, -9.25, 0), Vector3.create(15.3, -9.25, 0)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
    {
      path: [Vector3.create(18, -6.5, -6), Vector3.create(18, -11.75, -6)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      speed: 4
    },
    {
      path: [Vector3.create(15.3, -9.25, -12), Vector3.create(20.7, -9.25, -12)],
      rotation: Quaternion.fromEulerDegrees(0, 0, 90),
      speed: 4
    },
  ],

  boostRings: [
    { position: Vector3.create(0, -26, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
  ],

  boostRingGroups: [
    //Rings 1 (outer)
    [
    { position: Vector3.create(0, 14, 20) },
    { position: Vector3.create(0, 24, 20) },

    { position: Vector3.create(15, 14, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(15, 24, 15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, 14, -20) },
    { position: Vector3.create(0, 24, -20) },

    { position: Vector3.create(15, 14, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(15, 24, -15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(20, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(20, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, 14, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-15, 24, 15), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-20, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-20, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-15, 14, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-15, 24, -15), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 2 (middle)
    [
    { position: Vector3.create(0, -16, 12) },
    { position: Vector3.create(0, -6, 12) },
    { position: Vector3.create(0, 4, 12) },
    { position: Vector3.create(0, 14, 12) },
    { position: Vector3.create(0, 24, 12) },

    { position: Vector3.create(9, -16, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, -6, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 4, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 14, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(9, 24, 9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -16, -12) },
    { position: Vector3.create(0, -6, -12) },
    { position: Vector3.create(0, 4, -12) },
    { position: Vector3.create(0, 14, -12) },
    { position: Vector3.create(0, 24, -12) },

    { position: Vector3.create(9, -16, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, -6, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 4, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 14, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(9, 24, -9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(12, -16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(12, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -16, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, -6, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 4, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 14, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-9, 24, 9), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-12, -16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-12, 24, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-9, -16, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, -6, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 4, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 14, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-9, 24, -9), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ],

    //Rings 3 (inner)
    [
    { position: Vector3.create(0, -16, 4) },
    { position: Vector3.create(0, -6, 4) },
    { position: Vector3.create(0, 4, 4) },
    { position: Vector3.create(0, 14, 4) },

    { position: Vector3.create(3, -16, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, -6, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 4, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(3, 14, 3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },

    { position: Vector3.create(0, -16, -4) },
    { position: Vector3.create(0, -6, -4) },
    { position: Vector3.create(0, 4, -4) },
    { position: Vector3.create(0, 14, -4) },

    { position: Vector3.create(3, -16, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, -6, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 4, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(3, 14, -3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(4, -16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(4, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -16, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, -6, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 4, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },
    { position: Vector3.create(-3, 14, 3), rotation: Quaternion.fromEulerDegrees(0, 135, 0) },

    { position: Vector3.create(-4, -16, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, -6, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 4, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },
    { position: Vector3.create(-4, 14, 0), rotation: Quaternion.fromEulerDegrees(0, 90, 0) },

    { position: Vector3.create(-3, -16, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, -6, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 4, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    { position: Vector3.create(-3, 14, -3), rotation: Quaternion.fromEulerDegrees(0, 45, 0) },
    ]
  ]

}
