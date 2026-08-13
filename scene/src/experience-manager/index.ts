/**
 * Experience registry
 */
import { registerExperience } from './experienceManager'
import { lobbyExperience } from './lobbyExperience'
import { runnerExperience } from './runnerExperience'

export function registerExperiences(): void {
  registerExperience('lobby', lobbyExperience)
  registerExperience('runner', runnerExperience)
}

export {
  switchExperience,
  getCurrentExperience,
  isSwitching,
} from './experienceManager'
export type { ExperienceKind } from './experienceManager'
