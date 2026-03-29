/** The 1st through 9th prime numbers; internal cell values 1–9 map to these (index = value − 1). */
export const PRIMES_1_TO_9: readonly number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23]

/**
 * Returns the display label for an internal digit 1–9, or empty string for 0.
 */
export function primeLabel(internalValue: number): string {
  if (internalValue < 1 || internalValue > 9) return ''
  return String(PRIMES_1_TO_9[internalValue - 1])
}
