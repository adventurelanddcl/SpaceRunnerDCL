import { Gem } from './gem'

/**
 * Stores the amount of each gem type the player currently has.
 */
const inventory: Record<Gem, number> = {
  [Gem.BLACK]: 0,
  [Gem.BLUE]: 0,
  [Gem.PURPLE]: 0,
  [Gem.GOLD]: 0
}

/**
 * Adds one unit of the specified gem type to the inventory.
 */
export function addGemToInventory(gem: Gem): number {
  inventory[gem] += 1
  return inventory[gem]
}

/**
 * Retrieves the current count of a specific gem type.
 */
export function getGemCountByType(gem: Gem): number {
  return inventory[gem]
}

/**
 * Resets all gem counts back to zero.
 */
export function resetInventory() {
  for (const gem of Object.values(Gem) as Gem[]) {
    inventory[gem] = 0
  }
}
