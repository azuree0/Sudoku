import './style.css'
import { BOARD_PAD } from './tridoku/constants'
import { TridokuGame } from './tridoku/game'
import { primeLabel } from './tridoku/primes'
import {
  CELL_COUNT,
  CENTROIDS,
  TRIANGLES,
  VERTS
} from './tridoku/topology'

const canvas = document.getElementById('board') as HTMLCanvasElement
/** Alpha channel so unpainted areas stay transparent (desktop shows through the shell). */
const ctx = canvas.getContext('2d', { alpha: true })!
const newGameBtn = document.getElementById('newgame') as HTMLButtonElement
const resolveBtn = document.getElementById('resolve') as HTMLButtonElement
const conflictsEl = document.getElementById('conflicts') as HTMLSpanElement
const statusEl = document.getElementById('status') as HTMLParagraphElement

const game = new TridokuGame()

/** Barycentric point-in-triangle test (same-side method). */
function pointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): boolean {
  const sign = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number
  ) => (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y)
  const d1 = sign(px, py, ax, ay, bx, by)
  const d2 = sign(px, py, bx, by, cx, cy)
  const d3 = sign(px, py, cx, cy, ax, ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/** Layout: model coords (y up in math sense) → canvas (y down). */
let minX = 0
let maxY = 0
let scale = 1

/**
 * Recomputes scale and translation from vertex bounds to fit the canvas.
 */
function updateLayout(): void {
  let mx = Infinity
  let Mx = -Infinity
  let my = Infinity
  let My = -Infinity
  for (const t of TRIANGLES) {
    for (const vi of t) {
      const v = VERTS[vi]
      mx = Math.min(mx, v.x)
      Mx = Math.max(Mx, v.x)
      my = Math.min(my, v.y)
      My = Math.max(My, v.y)
    }
  }
  minX = mx
  maxY = My
  const w = Mx - mx
  const h = My - my
  const cw = canvas.width - 2 * BOARD_PAD
  const ch = canvas.height - 2 * BOARD_PAD
  scale = Math.min(cw / w, ch / h)
}

/**
 * Maps model coordinates to canvas pixels.
 */
function toCanvas(x: number, y: number): { x: number; y: number } {
  return {
    x: BOARD_PAD + (x - minX) * scale,
    y: BOARD_PAD + (maxY - y) * scale
  }
}

/**
 * Maps canvas pixel coordinates (bitmap space) to model coordinates.
 */
function canvasToModel(cx: number, cy: number): { x: number; y: number } {
  return {
    x: minX + (cx - BOARD_PAD) / scale,
    y: maxY - (cy - BOARD_PAD) / scale
  }
}

/**
 * PRNG in [0, 1); injectable for tests.
 */
function rng(): number {
  return Math.random()
}

/**
 * Starts a new puzzle and refreshes HUD.
 */
function newGame(): void {
  game.newPuzzle(rng)
  statusEl.textContent = ''
  conflictsEl.textContent = String(game.conflictCount())
  draw()
}

/**
 * Fills from the stored solution.
 */
function autoResolve(): void {
  game.autoResolve()
  conflictsEl.textContent = String(game.conflictCount())
  statusEl.textContent = game.won ? 'Solved (auto resolve).' : ''
  draw()
}

/**
 * Maps pointer position to cell index, or null if outside all triangles.
 */
function pointerToIndex(clientX: number, clientY: number): number | null {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const cx = (clientX - rect.left) * scaleX
  const cy = (clientY - rect.top) * scaleY
  const m = canvasToModel(cx, cy)
  for (let i = CELL_COUNT - 1; i >= 0; i--) {
    const t = TRIANGLES[i]
    const a = VERTS[t[0]]
    const b = VERTS[t[1]]
    const c = VERTS[t[2]]
    if (pointInTriangle(m.x, m.y, a.x, a.y, b.x, b.y, c.x, c.y)) {
      return i
    }
  }
  return null
}

/**
 * Fills one triangular cell with upper-left key light.
 */
function drawCellBackground(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  selected: boolean,
  conflict: boolean
): void {
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.lineTo(cx, cy)
  ctx.closePath()

  const mx = (ax + bx + cx) / 3
  const my = (ay + by + cy) / 3
  const gx1 = Math.min(ax, bx, cx)
  const gy1 = Math.min(ay, by, cy)
  const gx2 = Math.max(ax, bx, cx)
  const gy2 = Math.max(ay, by, cy)

  const base = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
  if (conflict) {
    base.addColorStop(0, 'rgba(255, 200, 200, 0.98)')
    base.addColorStop(1, 'rgba(255, 160, 160, 0.98)')
  } else if (selected) {
    base.addColorStop(0, 'rgba(220, 235, 255, 0.98)')
    base.addColorStop(1, 'rgba(180, 205, 245, 0.98)')
  } else {
    base.addColorStop(0, 'rgba(255, 255, 255, 1)')
    base.addColorStop(1, 'rgba(235, 235, 235, 1)')
  }
  ctx.fillStyle = base
  ctx.fill()

  const hx = gx1 + (gx2 - gx1) * 0.22
  const hy = gy1 + (gy2 - gy1) * 0.2
  const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.min(gx2 - gx1, gy2 - gy1) * 0.42)
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
  spec.addColorStop(0.45, 'rgba(255, 255, 255, 0.2)')
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = spec
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
}

/**
 * Paints the full Tridoku board and digits.
 */
function draw(): void {
  updateLayout()
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const cells = game.getCells()
  for (let i = 0; i < CELL_COUNT; i++) {
    const t = TRIANGLES[i]
    const a = toCanvas(VERTS[t[0]].x, VERTS[t[0]].y)
    const b = toCanvas(VERTS[t[1]].x, VERTS[t[1]].y)
    const c = toCanvas(VERTS[t[2]].x, VERTS[t[2]].y)
    const sel = game.selection === i
    const conflict = game.hasConflict(i)
    drawCellBackground(a.x, a.y, b.x, b.y, c.x, c.y, sel, conflict)

    const cell = cells[i]
    if (cell.value !== 0) {
      const cen = toCanvas(CENTROIDS[i].x, CENTROIDS[i].y)
      const span =
        Math.hypot(a.x - b.x, a.y - b.y) +
        Math.hypot(b.x - c.x, b.y - c.y) +
        Math.hypot(c.x - a.x, c.y - a.y)
      const label = primeLabel(cell.value)
      const fontSize = Math.max(
        8,
        span * 0.09 * (label.length > 1 ? 0.78 : 1)
      )
      ctx.font = `600 ${fontSize}px "Segoe UI", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = cell.given ? '#0a0a0a' : '#1a3a6e'
      ctx.fillText(label, cen.x, cen.y + 1)
    }
  }

  if (game.won && statusEl.textContent === '') {
    statusEl.textContent = 'Solved — well done.'
  }
}

/**
 * Keyboard: arrows move selection in model space; digits edit; N new game.
 */
function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    game.moveSelection(0, 1)
    draw()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    game.moveSelection(0, -1)
    draw()
    return
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    game.moveSelection(-1, 0)
    draw()
    return
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    game.moveSelection(1, 0)
    draw()
    return
  }
  if (e.key === 'n' || e.key === 'N') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      newGame()
    }
    return
  }
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault()
    game.setDigitAtSelection(0)
    conflictsEl.textContent = String(game.conflictCount())
    if (!game.won) statusEl.textContent = ''
    draw()
    return
  }
  const code = e.code
  if (code.startsWith('Digit')) {
    const d = Number(code.slice(5))
    if (d >= 1 && d <= 9) {
      e.preventDefault()
      game.setDigitAtSelection(d)
      conflictsEl.textContent = String(game.conflictCount())
      if (!game.won) statusEl.textContent = ''
      draw()
    }
    return
  }
  if (code.startsWith('Numpad')) {
    const tail = code.slice(6)
    if (tail === '0') {
      e.preventDefault()
      game.setDigitAtSelection(0)
      conflictsEl.textContent = String(game.conflictCount())
      if (!game.won) statusEl.textContent = ''
      draw()
      return
    }
    const d = Number(tail)
    if (d >= 1 && d <= 9) {
      e.preventDefault()
      game.setDigitAtSelection(d)
      conflictsEl.textContent = String(game.conflictCount())
      if (!game.won) statusEl.textContent = ''
      draw()
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  const idx = pointerToIndex(e.clientX, e.clientY)
  if (idx === null) return
  game.setSelection(idx)
  canvas.setPointerCapture(e.pointerId)
  draw()
})

newGameBtn.addEventListener('click', () => {
  newGame()
})

resolveBtn.addEventListener('click', () => {
  autoResolve()
})

window.addEventListener('keydown', onKeyDown)

newGame()
