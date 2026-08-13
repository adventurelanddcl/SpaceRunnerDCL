/**
 * Platform detection — replacement for `@dcl/sdk/platform`.
 *
 * The SDK's own `platform` module crashes on the Windows native app because
 * it unconditionally does `getExplorerInformation({}).then(...)` — but on
 * that runtime `getExplorerInformation` returns the response synchronously
 * (not a Promise), so the `.then` call throws `TypeError: ... is not a
 * function` and takes the whole scene down.
 *
 * This wrapper calls the same underlying host API but is defensive about
 * what it gets back: Promise OR plain object OR undefined/throw. Platform
 * detection is best-effort; if everything fails we default to 'desktop',
 * because that matches the safer UI behavior (toggleable dropdown — the
 * user can still click it).
 */
// `getExplorerInformation` isn't in the older `~system/Runtime` typings
// shipped with this scene, but the runtime itself exposes it. We pull it
// in with a ts-ignore and also guard the call at runtime — on some hosts
// (Windows native app) the function returns the response synchronously
// instead of a Promise, which crashes the SDK's own platform module.
// @ts-ignore — missing from older js-runtime typings, present at runtime.
import { getExplorerInformation } from '~system/Runtime'

export type Platform = 'mobile' | 'desktop' | 'web' | 'unknown'

const VALID_PLATFORMS: Platform[] = ['mobile', 'desktop', 'web']

let platform: Platform = 'unknown'

function applyResponse(response: { platform?: string } | undefined): void {
  if (!response || typeof response.platform !== 'string') return
  const normalized = response.platform.toLowerCase()
  if ((VALID_PLATFORMS as string[]).includes(normalized)) {
    platform = normalized as Platform
  } else {
    console.log(`platform: unknown value "${response.platform}"`)
  }
}

/**
 * Kicks off detection. Called once from the client branch of boot — not at
 * module load, because this module is also on the headless server's import path
 * and `getExplorerInformation` is a client-context API there.
 *
 * We have to guard *every* step — calling the API itself can throw, and the
 * return value can be either a Promise or a plain object depending on the
 * runtime.
 */
export function initPlatformDetection(): void {
  try {
    const maybeResult: any = (getExplorerInformation as any)({})
    if (maybeResult && typeof maybeResult.then === 'function') {
      // Promise path (web/preview/most mobile builds).
      maybeResult
        .then((response: any) => applyResponse(response))
        .catch((err: any) => {
          console.log('platform: getExplorerInformation promise rejected', err)
        })
    } else {
      // Sync path (Windows native app — returns the response directly).
      applyResponse(maybeResult)
    }
  } catch (err) {
    console.log('platform: getExplorerInformation threw', err)
  }
}

export function getPlatform(): Platform {
  return platform
}

export function isMobile(): boolean {
  return platform === 'mobile'
}

export function isDesktop(): boolean {
  return platform === 'desktop'
}

export function isWeb(): boolean {
  return platform === 'web'
}
