/**
 * Who is in the scene right now, and where they actually are. Server-only.
 *
 * The headless server sees every connected player as an entity carrying
 * `PlayerIdentityData` (a server-verified wallet address) and a `Transform` the
 * runtime keeps up to date. Positions read this way are the real ones — nothing
 * here trusts a client-reported position.
 */
import { AvatarBase, engine, PlayerIdentityData, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

/**
 * Every player currently in the scene, with their address **exactly as the
 * runtime reports it**.
 */
export function getConnectedAddresses(): string[] {
  const addresses: string[] = []
  for (const [, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (identity.address) addresses.push(identity.address)
  }
  return addresses
}

/**
 * A player's server-verified position, in scene-local metres — the same frame
 * scene entities use, so it can be compared to entity positions directly.
 * Undefined while the runtime has not reported a transform for them yet.
 */
export function getPlayerPosition(address: string): Vector3 | undefined {
  const key = address.toLowerCase()
  for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (identity.address?.toLowerCase() !== key) continue
    const transform = Transform.getOrNull(entity)
    return transform ? transform.position : undefined
  }
  return undefined
}

/**
 * A player's display name from their avatar, when the runtime has sent it to
 * the server. The client also reports it in `join`; whichever arrives first is
 * used, and `join` refreshes it.
 */
export function getPlayerName(address: string): string | undefined {
  const key = address.toLowerCase()
  for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (identity.address?.toLowerCase() !== key) continue
    const base = AvatarBase.getOrNull(entity)
    return base?.name || undefined
  }
  return undefined
}
