export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'ready'
  | 'error'

export type UpdateInstallMode = 'auto' | 'manual'

export interface UpdateState {
  status: UpdateStatus
  version?: string
  progress?: number
  message?: string
  /** macOS unsigned builds open the DMG manually instead of quitAndInstall */
  installMode?: UpdateInstallMode
  downloadUrl?: string
}

export interface UpdateInstallResult {
  success: boolean
  message?: string
}
