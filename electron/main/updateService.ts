import { app, BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater
import { DEFAULT_UPDATE_FEED_URL } from '../../src/shared/constants'
import { IPC } from '../../src/shared/ipc'
import type { UpdateState } from '../../src/shared/types/update'

let state: UpdateState = { status: 'idle' }

function broadcast(): void {
  const payload = { ...state }
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.update.stateChanged, payload)
    }
  }
}

export function getUpdateState(): UpdateState {
  return { ...state }
}

export function initAutoUpdater(): void {
  if (!app.isPackaged) {
    state = { status: 'idle', message: '开发模式不检查更新' }
    return
  }

  const feedUrl = process.env['UPDATE_FEED_URL'] || DEFAULT_UPDATE_FEED_URL
  autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    state = { status: 'checking' }
    broadcast()
  })

  autoUpdater.on('update-available', (info) => {
    state = { status: 'available', version: info.version }
    broadcast()
  })

  autoUpdater.on('update-not-available', (info) => {
    state = {
      status: 'not-available',
      version: info.version,
      message: '已是最新版本'
    }
    broadcast()
  })

  autoUpdater.on('error', (error) => {
    state = {
      status: 'error',
      message: error.message || '更新检查失败'
    }
    broadcast()
  })

  autoUpdater.on('download-progress', (progress) => {
    state = {
      status: 'downloading',
      version: state.version,
      progress: progress.percent
    }
    broadcast()
  })

  autoUpdater.on('update-downloaded', (info) => {
    state = { status: 'ready', version: info.version, message: '更新已下载，可立即安装' }
    broadcast()
  })

  setTimeout(() => {
    void checkForUpdates()
  }, 8000)
}

export async function checkForUpdates(): Promise<UpdateState> {
  if (!app.isPackaged) {
    state = { status: 'idle', message: '开发模式不检查更新' }
    return state
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : '检查更新失败'
    }
    broadcast()
  }

  return getUpdateState()
}

export async function downloadUpdate(): Promise<UpdateState> {
  if (!app.isPackaged) {
    return getUpdateState()
  }

  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : '下载更新失败'
    }
    broadcast()
  }

  return getUpdateState()
}

export function quitAndInstallUpdate(): void {
  if (!app.isPackaged) return
  autoUpdater.quitAndInstall()
}
