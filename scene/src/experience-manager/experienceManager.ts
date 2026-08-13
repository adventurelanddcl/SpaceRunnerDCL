/**
 * Experience manager
 */
export type ExperienceKind = 'lobby' | 'runner'

export interface Experience {
  /** Called once when this experience becomes active. Build entities, register systems. */
  enter(): void | Promise<void>
  /** Called once when leaving this experience. Remove everything enter() created. */
  exit(): void | Promise<void>
}

const registry: Partial<Record<ExperienceKind, Experience>> = {}
let current: ExperienceKind | null = null
let switching = false

export function registerExperience(kind: ExperienceKind, exp: Experience): void {
  registry[kind] = exp
}

export function getCurrentExperience(): ExperienceKind | null {
  return current
}

export function isSwitching(): boolean {
  return switching
}

/**
 * Exit the current experience (if any) then enter the next one.
 * No-op if the requested experience is already current or a switch is in progress.
 */
export async function switchExperience(next: ExperienceKind): Promise<void> {
  if (switching) {
    console.log('switchExperience: switch already in progress, ignoring', next)
    return
  }
  if (next === current) return
  const target = registry[next]
  if (!target) {
    console.log('switchExperience: no experience registered for', next)
    return
  }

  switching = true
  try {
    if (current) {
      const prev = registry[current]
      if (prev) {
        console.log('experience exit:', current)
        await prev.exit()
      }
    }
    current = next
    console.log('experience enter:', next)
    await target.enter()
  } catch (err) {
    console.log('switchExperience error', err)
  } finally {
    switching = false
  }
}
