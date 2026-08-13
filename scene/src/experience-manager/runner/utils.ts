/**
 * Returns a random integer between the given min and max values (inclusive).
 */

export function getRandomInt(min: number, max: number): number {
  // Ensure min is less than or equal to max
  if (min > max) {
    ;[min, max] = [max, min]
  }

  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Returns a random element from the provided array.
 */
export function getRandomItem<T>(arr: T[]): T | undefined {
  if (!arr.length) return

  const index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

/**
 * Formats time given in milliseconds as MM:SS.
 */
export function formatTime(time: number): string {
  const totalSeconds = Math.floor(time / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const formattedMinutes = String(minutes).padStart(2, '0')
  const formattedSeconds = String(seconds).padStart(2, '0')

  return `${formattedMinutes}:${formattedSeconds}`
}
