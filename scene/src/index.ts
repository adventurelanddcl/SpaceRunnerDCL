/**
 * Scene entry point.
 */
import './shared/messages'
import '@dcl-sdk/utils'

import { isServer } from '~system/EngineApi'

export async function main(): Promise<void> {
  let runningOnServer = false
  try {
    const response = await isServer({})
    runningOnServer = !!response.isServer
  } catch (err) {
    console.log('[BOOT] isServer() query failed — continuing as a client', err)
  }

  if (runningOnServer) {
    const { initServer } = await import('./server/server')
    initServer()
    return
  }

  const { initClientScene } = await import('./client/scene')
  initClientScene()
}
