<img width="614" height="454" alt="S" src="https://github.com/user-attachments/assets/eb052be2-5a56-4123-9a40-87439656a368" />

# Prior

**Install**

- **Node.js (npm)** — https://nodejs.org/en/download

```powershell
npm install
```

**Build**

```powershell
npm run build
```

**Run**

```powershell
npm run dev
```

**localhost**
```powershell
npx vite src/renderer
```


# Game Rule

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ • Grid: 81 triangular cells; nine nonets; outer edges; inner    │
│   triangle sides; vertex-touch rule (no matching symbols).      │
│                                                                 │
│ • Conflicts: duplicate in a nonet, edge line, inner side, or    │
│   touching cells is highlighted; fix them to finish.            │
│                                                                 │
│ • Win: every cell uses the nine symbols (1st–9th primes         │
│   2–23); keys 1–9 map to primes on the board.                   │
└─────────────────────────────────────────────────────────────────┘
```

▼

# Function

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ • Constraint puzzle: TriDoku (81 triangles): nonets, outer      │
│   edges, inner sides, vertex-touch; symbols = 1st–9th primes.   │
│                                                                 │
│   2, 3, 5, 7, 11, 13, 17, 19, 23 (keys 1–9 on the board).       │
└─────────────────────────────────────────────────────────────────┘
```

# History

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ • 18th c.  Latin-square math (Euler and later combinatorics)    │
│                                                                 │
│ • 1979     Dell puzzle magazines: “Number Place” (Howard Garns) │
│                                                                 │
│ • 1984     Japan: Nikoli names it 数独 (Sudoku); national fad    │
│                                                                 │
│ • 1990s    Puzzle books and newspapers in Japan                 │
│                                                                 │
│ • 2000s    Global newspapers, web apps, handheld games          │
│                                                                 │
│ • 2010s+   Standard daily puzzle; many digital implementations  │
└─────────────────────────────────────────────────────────────────┘
```

# Structure

```text
├── electron-builder.yml           # win nsis + portable → release\                         (Config)    (Electron)
├── electron.vite.config.ts        # main/preload/renderer entries                          (Config)    (TypeScript) (Electron)
├── package.json                   # scripts, dependencies, main entry `out/main/index.js`  (Config)    (Node.js)
├── tsconfig.json                  # solution references                                    (Config)    (TypeScript)
├── tsconfig.node.json             # main + preload + electron.vite TypeScript              (Config)    (TypeScript)
├── tsconfig.web.json              # renderer TypeScript                                    (Config)    (TypeScript)
├── .gitignore                     # ignores node_modules, out, release                     (Config)
├── README.md                      # install, diagrams, tree                                (Config)
└── src
    ├── main
    │   └── index.ts               # BrowserWindow, load renderer                           (Backend)   (TypeScript) (Node.js) (Electron)
    ├── preload
    │   └── index.ts               # contextBridge exposes minimal API                      (Backend)   (TypeScript) (Node.js) (Electron)
    └── renderer
        ├── index.html             # canvas + HUD markup                                    (Frontend)  (Electron)
        └── src
            ├── env.d.ts           # window typings                                         (Frontend)  (TypeScript)
            ├── renderer.ts        # canvas draw, pointer + keyboard, HUD sync              (Frontend)  (TypeScript)
            ├── style.css          # layout + theme                                         (Frontend)
            └── sudoku
                ├── constants.ts   # cell size, pads, givens target                         (Frontend)  (TypeScript)
                ├── game.ts        # SudokuGame state, selection, conflicts, resolve        (Frontend)  (TypeScript)
                ├── generator.ts   # full grid + dig for unique puzzle                      (Frontend)  (TypeScript)
                ├── solver.ts      # fill, count solutions, rule checks                     (Frontend)  (TypeScript)
                └── types.ts       # Cell, BoardIndex                                       (Frontend)  (TypeScript)
```
