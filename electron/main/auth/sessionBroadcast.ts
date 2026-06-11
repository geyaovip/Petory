import { BrowserWindow } from 'electron'
import { IPC } from '../../../src/shared/ipc'

export function broadcastSessionExpired(message: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.auth.sessionExpired, { message })
    }
  }
}
