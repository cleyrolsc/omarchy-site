/** Build the 1200x630 social card at public/brand/omarchy-og.png. */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public/brand/omarchy-og.png')

const W = 1200
const H = 630

const BG = '#0e0e14'
const RAMP = ['#39482e', '#4f6a3b', '#678549', '#9ece6a']
const WORDMARK_INKS = ['#daecc6', '#bbdd97', '#9ece6a', '#678549', '#39482e']

// The wordmark's own grid: 81 cells across, 19 down, each cell 51 wide by
// 50 tall in the SVG's units. The card keeps that aspect exactly.
const bitmap = fs.readFileSync(
  path.join(root, 'src/data/wordmark-bitmap.ts'),
  'utf8',
)
const ROWS = [...bitmap.matchAll(/'([01]{81})'/g)].map((m) => m[1])
if (ROWS.length !== 19) throw new Error(`expected 19 rows, read ${ROWS.length}`)

// Use whole pixels per cell so downsampling preserves sharp edges.
const CW = 11
const CH = 11
const COLS = Math.ceil(W / CW)
const GRID_ROWS = Math.ceil(H / CH)

const WM_COL = Math.round((COLS - 81) / 2)
const WM_ROW = 10

// Deterministic: the card should be the same picture every time it is built.
const rand = (() => {
  let s = 0x9e3779b9
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
})()

const lit = (r, c) => r >= 0 && r < 19 && c >= 0 && c < 81 && ROWS[r][c] === '1'
// Is any letter cell within `reach` cells of this one?
const within = (r, c, reach) => {
  for (let dr = -reach; dr <= reach; dr++)
    for (let dc = -reach; dc <= reach; dc++)
      if (lit(r + dr, c + dc)) return true
  return false
}

const cells = []
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const wr = row - WM_ROW
    const wc = col - WM_COL
    if (lit(wr, wc)) continue
    if (row * CH > 365 && row * CH < 535 && col * CW > 90 && col * CW < 1110)
      continue

    const near1 = within(wr, wc, 1)
    if (near1) continue
    const near2 = within(wr, wc, 2)

    const dx = (col - (WM_COL + 40)) / 62
    const dy = (row - (WM_ROW + 9)) / 26
    const d = Math.sqrt(dx * dx + dy * dy)
    const near = Math.max(0, 1 - d)
    const chance = (0.014 + 0.15 * near * near) * (near2 ? 0.35 : 1)
    if (rand() > chance) continue

    const r = rand()
    const tier = near2
      ? 0
      : r < 0.52
        ? 0
        : r < 0.78
          ? 1
          : r < 0.93
            ? 2
            : near > 0.45
              ? 3
              : 2
    cells.push(
      `<rect x="${col * CW}" y="${row * CH}" width="${CW}" height="${CH}" fill="${RAMP[tier]}"/>`,
    )
  }
}

const wordmark = []
for (let row = 0; row < 19; row++) {
  const ink =
    WORDMARK_INKS[row < 5 ? 0 : row < 7 ? 1 : row < 11 ? 2 : row < 14 ? 3 : 4]
  for (let col = 0; col < 81; col++) {
    if (lit(row, col)) {
      wordmark.push(
        `<rect x="${(WM_COL + col) * CW}" y="${(WM_ROW + row) * CH}" width="${CW}" height="${CH}" fill="${ink}"/>`,
      )
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
${cells.join('')}
${wordmark.join('')}
</svg>`

const fontfile = path.join(
  root,
  'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
)
const labels = [
  {
    text: 'Beautiful, fun &amp; agentic Linux by DHH',
    size: 28,
    weight: 'Medium',
    color: '#c0caf5',
    top: 390,
  },
  {
    text: 'The malleable OS for the age of agents.',
    size: 17,
    weight: 'Regular',
    color: '#a9b1d6',
    top: 454,
  },
  {
    text: 'Vibe your way through every alteration, tweak, or trouble.',
    size: 17,
    weight: 'Regular',
    color: '#a9b1d6',
    top: 482,
  },
]
const overlays = await Promise.all(
  labels.map(async (label) => {
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${label.color}">${label.text}</span>`,
        font: `JetBrains Mono ${label.weight} ${label.size}`,
        fontfile,
        rgba: true,
        dpi: 72,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true })
    return {
      input: data,
      left: Math.round((W - info.width) / 2),
      top: label.top,
    }
  }),
)
await sharp(Buffer.from(svg))
  .composite(overlays)
  .png({ palette: true })
  .toFile(out)

const { size } = fs.statSync(out)
console.log(
  `${path.relative(root, out)} - ${cells.length} field cells, ${(size / 1024).toFixed(0)} kB`,
)
