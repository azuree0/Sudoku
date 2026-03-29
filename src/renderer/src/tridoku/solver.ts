import { CELL_COUNT, CONSTRAINT_GROUPS, TOUCH_NEIGHBORS } from './topology'

/** For each cell, which constraint group indices apply (nonets, edges, inner sides). */
const GROUPS_FOR_CELL: readonly number[][] = (() => {
  const out: number[][] = Array.from({ length: CELL_COUNT }, () => [])
  for (let gi = 0; gi < CONSTRAINT_GROUPS.length; gi++) {
    for (const i of CONSTRAINT_GROUPS[gi]) {
      out[i].push(gi)
    }
  }
  return out
})()

/**
 * True if placing `value` at `index` would break touch or any constraint group.
 * Assumes `board[index] === 0` while testing a candidate.
 */
export function violatesRules(
  board: Uint8Array,
  index: number,
  value: number
): boolean {
  for (const j of TOUCH_NEIGHBORS[index]) {
    if (board[j] === value) return true
  }
  for (const gi of GROUPS_FOR_CELL[index]) {
    for (const j of CONSTRAINT_GROUPS[gi]) {
      if (j !== index && board[j] === value) return true
    }
  }
  return false
}

/**
 * Fisher–Yates shuffle using `rng` in [0, 1).
 */
function shuffleDigits(rng: () => number): number[] {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Lists valid digits for empty cell `i` given current `board`.
 */
function optionsFor(board: Uint8Array, i: number, rng: () => number): number[] {
  const order = shuffleDigits(rng)
  const out: number[] = []
  for (const d of order) {
    if (!violatesRules(board, i, d)) out.push(d)
  }
  return out
}

/**
 * Fills `board` with one full valid assignment using MRV backtracking.
 */
export function fillCompleteSolution(
  board: Uint8Array,
  rng: () => number
): boolean {
  let bestI = -1
  let bestOpts: number[] | null = null

  for (let i = 0; i < CELL_COUNT; i++) {
    if (board[i] !== 0) continue
    const opts = optionsFor(board, i, rng)
    if (opts.length === 0) return false
    if (bestOpts === null || opts.length < bestOpts.length) {
      bestI = i
      bestOpts = opts
      if (opts.length === 1) break
    }
  }

  if (bestI === -1) return true
  const opts = bestOpts!
  for (const d of opts) {
    board[bestI] = d
    if (fillCompleteSolution(board, rng)) return true
    board[bestI] = 0
  }
  return false
}

/**
 * Counts solutions up to `limit` (early exit when count reaches limit).
 */
export function countSolutions(board: Uint8Array, limit: number): number {
  let count = 0

  function dfs(): void {
    if (count >= limit) return
    let bestI = -1
    let bestOpts: number[] | null = null
    for (let i = 0; i < CELL_COUNT; i++) {
      if (board[i] !== 0) continue
      const opts: number[] = []
      for (let d = 1; d <= 9; d++) {
        if (!violatesRules(board, i, d)) opts.push(d)
      }
      if (opts.length === 0) return
      if (bestOpts === null || opts.length < bestOpts.length) {
        bestI = i
        bestOpts = opts
        if (opts.length === 1) break
      }
    }
    if (bestI === -1) {
      count++
      return
    }
    for (const d of bestOpts!) {
      board[bestI] = d
      dfs()
      board[bestI] = 0
      if (count >= limit) return
    }
  }

  dfs()
  return count
}
