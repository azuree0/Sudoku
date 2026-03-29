/** One cell: digit 1–9 or empty (0); givens cannot be edited. */
export interface Cell {
  value: number
  given: boolean
}

/** Flat index 0..80 into the 81 triangular cells (sorted triangle order). */
export type BoardIndex = number
