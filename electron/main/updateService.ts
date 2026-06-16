import { app, BrowserWindow, shell } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater
import { DEFAULT_UPDATE_FEED_URL, PETORY_GITHUB_RELEASE_BASE } from '../../src/shared/constants'
import { IPC } from '../../src/shared/ipc'
import type { UpdateInstallResult, UpdateState } from '../../src/shared/types/update'

let state: UpdateState = { status: 'idle' }
let pendingCheck: Promise<UpdateState> | null = null
let checkSeq = 0

function broadcast(): void {
  const payload = { ...state }
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.update.stateChanged, payload)
    }
  }
}

function isUpdateLocked(): boolean {
  return state.status === 'ready' || state.status === 'downloading'
}

function isMacManualInstall(): boolean {
  return process.platform === 'darwin'
}

function invalidateChecks(): void {
  checkSeq += 1
}

function resolveInstallerUrl(info: { version: string; files?: Array<{ url?: string }> }): string {
  const ext = process.platform === 'darwin' ? '.dmg' : '.exe'
  const fromFeed = info.files?.find((file) => file.url?.toLowerCase().includes(ext))?.url
  if (fromFeed) return fromFeed
  if (process.platform === 'darwin') {
    return `${PETORY_GITHUB_RELEASE_BASE}/v${info.version}/Petory-${info.version}-universal.dmg`
  }
  return `${PETORY_GITHUB_RELEASE_BASE}/v${info.version}/Petory-Setup-${info.version}.exe`
}

function withInstallMeta(
  partial: UpdateState,
  info?: { version: string; files?: Array<{ url?: string }> }
): UpdateState {
  const version = partial.version ?? info?.version
  return {
    ...partial,
    version,
    installMode: isMacManualInstall() ? 'manual' : 'auto',
    downloadUrl: version ? resolveInstallerUrl({ version, files: info?.files }) : undefined
  }
}

export function getUpdateState(): UpdateState {
  return { ...state }
}

function applyCheckResult(result: Awaited<ReturnType<typeof autoUpdater.checkForUpdates>>): void {
  if (!result || isUpdateLocked()) return

  if (result.isUpdateAvailable) {
    state = withInstallMeta(
      {
        status: 'available',
        version: result.updateInfo.version,
        message: isMacManualInstall() ? '发现新版本，可打开安装包更新。' : undefined
      },
      result.updateInfo
    )
  } else {
    state = {
      status: 'not-available',
      version: result.updateInfo.version || app.getVersion(),
      message: '已是最新版本'
    }
  }
  broadcast()
}

export function initAutoUpdater(): void {
  if (!app.isPackaged) {
    state = { status: 'idle', message: '开发模式不检查更新' }
    return
  }

  const feedUrl = process.env['UPDATE_FEED_URL'] || DEFAULT_UPDATE_FEED_URL
  autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = !isMacManualInstall()

  autoUpdater.on('error', (error) => {
    if (isUpdateLocked()) return
    state = {
      status: 'error',
      message: error.message || '更新检查失败'
    }
    broadcast()
  })

  autoUpdater.on('download-progress', (progress) => {
    state = {
      ...state,
      status: 'downloading',
      version: state.version,
      progress: progress.percent
    }
    broadcast()
  })

  autoUpdater.on('update-downloaded', (info) => {
    invalidateChecks()
    pendingCheck = null
    state = withInstallMeta(
      {
        status: 'ready',
        version: info.version,
        message: isMacManualInstall()
          ? '更新已下载。请点击「打开安装包」完成安装。'
          : '更新已下载，可立即安装'
      },
      info
    )
    broadcast()
  })

  setTimeout(() => {
    if (state.status === 'idle') {
      void checkForUpdates()
    }
  }, 8000)
}

async function runCheckForUpdates(): Promise<UpdateState> {
  if (!app.isPackaged) {
    state = { status: 'idle', message: '开发模式不检查更新' }
    return state
  }

  if (isUpdateLocked()) {
    return getUpdateState()
  }

  const seq = ++checkSeq
  state = { status: 'checking' }
  broadcast()

  try {
    const result = await autoUpdater.checkForUpdates()
    if (seq !== checkSeq || isUpdateLocked()) return getUpdateState()
    applyCheckResult(result)
  } catch (error) {
    if (seq !== checkSeq || isUpdateLocked()) return getUpdateState()
    state = {
      status: 'error',
      message: error instanceof Error ? error.message : '检查更新失败'
    }
    broadcast()
  }

  return getUpdateState()
}

export function checkForUpdates(): Promise<UpdateState> {
  if (isUpdateLocked()) {
    return Promise.resolve(getUpdateState())
  }

  if (!pendingCheck) {
    pendingCheck = runCheckForUpdates().finally(() => {
      pendingCheck = null
    })
  }
  return pendingCheck
}

export async function downloadUpdate(): Promise<UpdateState> {
  if (!app.isPackaged) {
    return getUpdateState()
  }

  if (state.status !== 'available') {
    return getUpdateState()
  }

  if (isMacManualInstall()) {
    return quitAndInstallUpdate().then(() => getUpdateState())
  }

  invalidateChecks()
  pendingCheck = null

  state = { ...state, status: 'downloading', progress: 0 }
  broadcast()

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

export async function quitAndInstallUpdate(): Promise<UpdateInstallResult> {
  if (!app.isPackaged) {
    return { success: false, message: '开发模式不可用' }
  }

  if (isMacManualInstall()) {
    if (state.status !== 'available' && state.status !== 'ready') {
      return { success: false, message: '没有可安装的更新' }
    }
    const version = state.version
    const url = state.downloadUrl ?? (version ? resolveInstallerUrl({ version }) : '')
    if (!url) {
      return { success: false, message: '未找到安装包地址' }
    }
    await shell.openExternal(url)
    setTimeout(() => app.quit(), 400)
    return {
      success: true,
      message: '已打开安装包。请先将 Petory 退出，再把新版本拖入「应用程序」文件夹。'
    }
  }

  if (state.status !== 'ready') {
    return { success: false, message: '请等待更新下载完成' }
  }

  setImmediate(() => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.removeAllListeners('close')
    }
    app.removeAllListeners('window-all-closed')
    autoUpdater.quitAndInstall(false, true)
  })

  return { success: true }
}
