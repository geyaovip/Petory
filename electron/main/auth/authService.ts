import type { AuthActionResult, AuthState, LoginInput, RegisterInput } from '../../../src/shared/types/auth'
import { isRemoteBackendEnabled } from '../api/config'
import { refreshAppStatus } from '../api/appStatus'
import { ensureRemoteQuotaFresh } from '../api/remoteQuotaStore'
import { buildAuthState } from './entitlementService'
import { clearSession, loadSession } from './authStore'
import * as mock from './mockAuth'
import * as remote from './remoteAuth'

export function getAuthState() {
  return buildAuthState()
}

export function rejectLegacyOfflineSession(): void {
  const session = loadSession()
  if (session?.mode === 'offline') {
    clearSession()
  }
}

export function isAuthenticated(): boolean {
  const session = loadSession()
  return session !== null && session.mode === 'account'
}

export async function login(input: LoginInput): Promise<AuthActionResult> {
  if (isRemoteBackendEnabled()) return remote.remoteLogin(input)
  return mock.login(input)
}

export async function register(input: RegisterInput): Promise<AuthActionResult> {
  if (isRemoteBackendEnabled()) return remote.remoteRegister(input)
  return mock.register(input)
}

export async function logout(): Promise<AuthActionResult> {
  if (isRemoteBackendEnabled() && loadSession()?.mode === 'account') {
    return remote.remoteLogout()
  }
  return mock.logout()
}

export async function redeemCode(code: string): Promise<AuthActionResult> {
  if (isRemoteBackendEnabled() && loadSession()?.mode === 'account') {
    return remote.remoteRedeemCode(code)
  }
  return mock.redeemCode(code)
}

export function clearAuthData(): void {
  mock.clearAuthData()
}

export async function bootstrapRemoteSession(): Promise<void> {
  if (!isRemoteBackendEnabled()) return
  await refreshAppStatus(true)
  const session = loadSession()
  if (session?.mode === 'account' && session.token !== 'offline') {
    try {
      await ensureRemoteQuotaFresh(true)
    } catch (error) {
      console.warn('[petory] failed to refresh remote quota:', error)
    }
  }
}

export async function refreshAuthState(): Promise<AuthState> {
  await bootstrapRemoteSession()
  try {
    await ensureRemoteQuotaFresh(true)
  } catch (error) {
    console.warn('[petory] failed to refresh auth quota state:', error)
  }
  return buildAuthState()
}
