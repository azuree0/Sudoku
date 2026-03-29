import type { Cell } from './types'
import { CELL_COUNT, CENTROIDS, TOUCH_NEIGHBORS } from './topology'
import { violatesRules } from './solver'
import { generatePuzzle } from './generator'

/**
 * Playable Tridoku session: selection, edits, conflict set, win detection.
 */
export class TridokuGame {
  /** Starting puzzle (givens only). */
  private initial = new Uint8Array(CELL_COUNT)

  /** Unique solution for auto-resolve. */
  private solution = new Uint8Array(CELL_COUNT)

  /** Current grid. */
  private grid = new Uint8Array(CELL_COUNT)

  /** Selected cell index or -1. */
  selection: number = 0

  /** Cells in conflict with another rule. */
  private conflictSet = new Set<number>()

  /** True when every cell is filled and there are no conflicts. */
  won = false

  /**
   * Regenerates a puzzle using `rng`.
   */
  newPuzzle(rng: () => number): void {
    const { puzzle, solution } = generatePuzzle(rng)
    this.solution = new Uint8Array(solution)
    this.initial = new Uint8Array(puzzle)
    this.grid = new Uint8Array(puzzle)
    this.selection = this.firstEmptyOrZero()
    this.recomputeConflicts()
    this.won = false
  }

  /**
   * Fills non-given cells from the stored solution.
   */
  autoResolve(): void {
    for (let i = 0; i < CELL_COUNT; i++) {
      if (this.initial[i] === 0) {
        this.grid[i] = this.solution[i]
      }
    }
    this.recomputeConflicts()
    this.checkWin()
  }

  /**
   * First empty cell index, or 0 if full.
   */
  private firstEmptyOrZero(): number {
    for (let i = 0; i < CELL_COUNT; i++) {
      if (this.grid[i] === 0) return i
    }
    return 0
  }

  /**
   * True if the cell is a given clue.
   */
  isGiven(index: number): boolean {
    return this.initial[index] !== 0
  }

  /**
   * Current cells for rendering.
   */
  getCells(): Cell[] {
    const out: Cell[] = []
    for (let i = 0; i < CELL_COUNT; i++) {
      out.push({
        value: this.grid[i],
        given: this.initial[i] !== 0
      })
    }
    return out
  }

  /**
   * Number of cells currently in conflict.
   */
  conflictCount(): number {
    return this.conflictSet.size
  }

  /**
   * Whether `index` is marked conflicting.
   */
  hasConflict(index: number): boolean {
    return this.conflictSet.has(index)
  }

  /**
   * Moves selection to the touch neighbor best aligned with model-space direction `(dx, dy)`.
   */
  moveSelection(dx: number, dy: number): void {
    const i = this.selection
    const len = Math.hypot(dx, dy)
    if (len < 1e-9) return
    const nx = dx / len
    const ny = dy / len
    const cx = CENTROIDS[i].x
    const cy = CENTROIDS[i].y
    let best = -1
    let bestDot = -2
    for (const j of TOUCH_NEIGHBORS[i]) {
      const dxj = CENTROIDS[j].x - cx
      const dyj = CENTROIDS[j].y - cy
      const lj = Math.hypot(dxj, dyj)
      if (lj < 1e-9) continue
      const dot = (dxj / lj) * nx + (dyj / lj) * ny
      if (dot > bestDot) {
        bestDot = dot
        best = j
      }
    }
    if (best >= 0) this.selection = best
  }

  /**
   * Sets selection when `index` is in range.
   */
  setSelection(index: number): void {
    if (index >= 0 && index < CELL_COUNT) this.selection = index
  }

  /**
   * Places a digit on the selected cell if editable.
   */
  setDigitAtSelection(digit: number): void {
    if (this.isGiven(this.selection)) return
    if (digit < 0 || digit > 9) return
    this.grid[this.selection] = digit
    this.recomputeConflicts()
    this.checkWin()
  }

  /**
   * Rebuilds conflict set from current grid.
   */
  private recomputeConflicts(): void {
    this.conflictSet.clear()
    for (let i = 0; i < CELL_COUNT; i++) {
      const v = this.grid[i]
      if (v === 0) continue
      if (violatesRules(this.grid, i, v)) {
        this.conflictSet.add(i)
      }
    }
  }

  /**
   * Sets `won` when the grid is full and conflict-free.
   */
  private checkWin(): void {
    if (this.conflictSet.size > 0) {
      this.won = false
      return
    }
    for (let i = 0; i < CELL_COUNT; i++) {
      if (this.grid[i] === 0) {
        this.won = false
        return
      }
    }
    this.won = true
  }
}
