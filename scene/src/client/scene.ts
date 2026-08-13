/**
 * Everything the *client* builds: the world, the UI, and the link to the
 * headless server. This is the old `main()` body, moved out of `index.ts` so
 * the entry point only has to choose a side.
 *
 * None of this runs on the server, which renders nothing.
 */
import { engine, Transform } from '@dcl/sdk/ecs'

import { createBoundaryWalls } from '../boundaryWalls'
import { SCENE_CENTER } from '../config'
import { registerExperiences, switchExperience } from '../experience-manager'
import { setRootEntity } from '../experience-manager/runner/gameState'
import { startMusic } from '../music'
import { initPlatformDetection } from '../platform'
import { createSkyBox } from '../skyBox'
import { createSkyDome } from '../skyDome'
import { setupUi } from '../ui/gameUI'
import { initConnection } from './connection'
import { initServerEvents } from './serverEvents'

export function initClientScene(): void {
  // Which explorer we're on drives a few UI/rendering choices. The probe is a
  // client-context host call, so it is kicked off here rather than at module
  // load (which would also run it on the server).
  initPlatformDetection()

  const root = engine.addEntity()
  Transform.create(root, { position: { x: SCENE_CENTER, y: SCENE_CENTER, z: SCENE_CENTER } })
  const skyBoxroot = engine.addEntity()
  Transform.create(skyBoxroot, { position: { x: SCENE_CENTER, y: SCENE_CENTER + 1, z: SCENE_CENTER } })
  setRootEntity(root)
  createSkyBox(skyBoxroot)

  // Mobile-only black skydome that follows the player, hiding the blue sky that
  // shows at the mobile render-distance edge (see skyDome.ts).
  createSkyDome()

  // Invisible perimeter walls so the player can't walk off the scene edge.
  createBoundaryWalls()

  // Looping soundtrack. Started once here (not per experience) so it plays
  // continuously in both the lobby and the runner without restarting on switch.
  //startMusic()

  setupUi()
  registerExperiences()

  // Watch for the server, and route its messages into the scene. Both are set
  // up before the first experience so nothing is missed while the lobby builds.
  initConnection()
  initServerEvents()

  // Default landing experience — Lobby
  switchExperience('lobby').catch((err: any) => {
    console.log('runner: initial lobby enter failed', err)
  })
}
