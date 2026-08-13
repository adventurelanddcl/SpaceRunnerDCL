import { Vector3 } from '@dcl/sdk/math'

import { GameMap } from './gameMap'
import { SCENE_CENTER } from '../../../config'

export const map1: GameMap = {
  modelPath: 'models/map1.glb',
  fallTriggerPosition: Vector3.create(0, -(SCENE_CENTER + 10) / 2 - 20, 0),
  spawnPosition: Vector3.create(84, SCENE_CENTER + 0.75, SCENE_CENTER),
  spawnCameraTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  spawnAvatarTarget: Vector3.create(SCENE_CENTER, SCENE_CENTER + 2, SCENE_CENTER),
  startPosition: Vector3.create(35, 3.2, 0),
  startSize: Vector3.create(11, 7, 12),
  finishPosition: Vector3.create(-36.2, 9.7, 0),
  finishSize: Vector3.create(11, 7, 12),
  windForceV2s: [
    { position: Vector3.create(0, -20, 0), strength: 45 },
  ],
  ballTraps: [
    {
      path: [Vector3.create(-35, 4, 36), Vector3.create(35, 4, 36)],
      speed: 12
    }
  ],
  bounceTraps: [
    { position: Vector3.create(19, 0.8, -18) },
    { position: Vector3.create(26, 0.8, 18) },
    { position: Vector3.create(-22, 4, 18) }
  ],
  bounceStands: [
    { position: Vector3.create(33, 0.8, -36) },
    { position: Vector3.create(27, 0.8, -36) },
    { position: Vector3.create(21, 0.8, -36) },
    { position: Vector3.create(15, 0.8, -36) },
    { position: Vector3.create(9, 0.8, -36) },
    { position: Vector3.create(3, 0.8, -36) },
    { position: Vector3.create(-3, 0.8, -36) }
  ],
}
