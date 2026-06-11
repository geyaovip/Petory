import { clearRemoteQuota } from '../api/remoteQuotaStore'
import { clearSession, loadSession } from './authStore'

let onExpired: (() => void) | null = null

export function setAuthExpiredHandler(handler: () => void): void {
  onExpired = handler
}

export function handleAuthExpired(): void {
  const session = loadSession()
  if (!session || session.mode !== 'account' || session.token === 'offline') return
  clearSession()
  clearRemoteQuota()
  onExpired?.()
}
