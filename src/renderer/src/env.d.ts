declare global {
  interface Window {
    electron: Record<string, unknown>
    api: Record<string, unknown>
  }
}

export {}
