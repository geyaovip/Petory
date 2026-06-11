import { app } from 'electron'

export function applyLaunchAtStartup(enabled: boolean): void {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false
    })
  }
}
