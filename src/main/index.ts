import { app, shell, BrowserWindow, type WebContents } from 'electron'
import { join } from 'path'

const ZOOM_STEP = 0.5

const ZOOM_MIN = -6

const ZOOM_MAX = 6

/**
 * Ctrl/Cmd + / - / 0 adjust page zoom (like browser chrome); works with hidden menu bar.
 */
function attachRendererZoomShortcuts(wc: WebContents): void {
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (!(input.control || input.meta)) return

    const { key, code } = input

    const zoomIn =
      code === 'Equal' || code === 'NumpadAdd' || key === '+' || key === '='
    const zoomOut =
      code === 'Minus' || code === 'NumpadSubtract' || key === '-' || key === '_'
    const reset = code === 'Digit0' || code === 'Numpad0' || key === '0'

    if (zoomIn) {
      event.preventDefault()
      wc.setZoomLevel(Math.min(wc.getZoomLevel() + ZOOM_STEP, ZOOM_MAX))
    } else if (zoomOut) {
      event.preventDefault()
      wc.setZoomLevel(Math.max(wc.getZoomLevel() - ZOOM_STEP, ZOOM_MIN))
    } else if (reset) {
      event.preventDefault()
      wc.setZoomLevel(0)
    }
  })
}

/** True while running from source (`electron-vite dev` / unpackaged); false in packaged builds. */
const isDev = !app.isPackaged

/** On Windows/Linux, frameless + title-bar overlay restores caption buttons; renderer uses `-webkit-app-region` to drag. */
const framelessWithCaptionOverlay =
  process.platform === 'win32' || process.platform === 'linux'

/** Creates the main Sudoku window and loads dev URL or production HTML. */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 820,
    /** titleBarOverlay 32 + #app padding 16+16 + board 540 ≈ 604; tight to content */
    height: 608,
    minWidth: 640,
    minHeight: 500,
    show: false,
    /** Desktop shows through unpainted regions; renderer uses frosted shell + opaque board canvas. */
    transparent: true,
    backgroundColor: '#00000000',
    ...(framelessWithCaptionOverlay
      ? {
          frame: false as const,
          titleBarOverlay: {
            height: 32,
            color: '#14161c',
            symbolColor: '#e8eaef'
          }
        }
      : {}),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  attachRendererZoomShortcuts(mainWindow.webContents)

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.sudoku.desktop')

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
