export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'ready'
  | 'error'

export interface UpdateState {
  status: UpdateStatus
  version?: string
  progress?: number
  message?: string
}
