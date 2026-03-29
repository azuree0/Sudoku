import { contextBridge } from 'electron'

/** Placeholder for future renderer-only APIs (saved games, etc.). */
const api = {}

/** Minimal preload: no extra packages so packaged app stays smaller. */
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {})
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
}
