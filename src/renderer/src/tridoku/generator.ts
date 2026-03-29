import { DIG_ATTEMPTS_PER_ROUND, TARGET_GIVENS_HARD } from './constants'
import { CELL_COUNT } from './topology'
import { countSolutions, fillCompleteSolution } from './solver'

/**
 * Copies a length-81 byte grid.
 */
function cloneBoard(src: Uint8Array): Uint8Array {
  return new Uint8Array(src)
}

/**
 * Builds a random full Tridoku solution, then removes clues while uniqueness holds
 * until at most `TARGET_GIVENS_HARD` givens remain.
 */
export function generatePuzzle(rng: () => number): {
  solution: Uint8Array
  puzzle: Uint8Array
} {
  const solution = new Uint8Array(CELL_COUNT)
  fillCompleteSolution(solution, rng)

  const puzzle = cloneBoard(solution)
  const target = TARGET_GIVENS_HARD

  while (true) {
    let givens = 0
    for (let i = 0; i < CELL_COUNT; i++) {
      if (puzzle[i] !== 0) givens++
    }
    if (givens <= target) break

    let removed = false
    for (let a = 0; a < DIG_ATTEMPTS_PER_ROUND; a++) {
      const idx = Math.floor(rng() * CELL_COUNT)
      if (puzzle[idx] === 0) continue
      const backup = puzzle[idx]
      puzzle[idx] = 0
      const trial = cloneBoard(puzzle)
      if (countSolutions(trial, 2) === 1) {
        removed = true
        break
      }
      puzzle[idx] = backup
    }
    if (!removed) break
  }

  return { solution, puzzle }
}
