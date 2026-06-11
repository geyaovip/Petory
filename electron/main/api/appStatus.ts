import type { AppStatusResponse } from '../../../src/shared/types/api'
import { apiFetchPublic } from './client'
import { isRemoteBackendEnabled } from './config'

let cache: AppStatusResponse | null = null
let fetchedAt = 0
const CACHE_MS = 60_000

export function getCachedAppStatus(): AppStatusResponse | null {
  return cache
}

export async function refreshAppStatus(force = false): Promise<AppStatusResponse | null> {
  if (!isRemoteBackendEnabled()) return null
  if (!force && cache && Date.now() - fetchedAt < CACHE_MS) return cache

  try {
    cache = await apiFetchPublic<AppStatusResponse>('/api/app/status')
    fetchedAt = Date.now()
    return cache
  } catch (error) {
    console.warn('[petory] failed to fetch app status:', error)
    return cache
  }
}

export function isGenerationServiceEnabled(): boolean {
  if (!isRemoteBackendEnabled()) return true
  return cache?.generationServiceEnabled !== false
}

export function isChatServiceEnabled(): boolean {
  if (!isRemoteBackendEnabled()) return true
  return cache?.chatServiceEnabled !== false
}

export function getMaintenanceNotice(): string | null {
  return cache?.maintenanceNotice ?? null
}

export function isRegistrationOpen(): boolean {
  if (!isRemoteBackendEnabled()) return true
  return cache?.registrationOpen !== false
}

export function isPaymentEnabled(): boolean {
  if (!isRemoteBackendEnabled()) return false
  return cache?.paymentEnabled !== false
}

export function isMockPaymentEnabled(): boolean {
  if (!isRemoteBackendEnabled()) return false
  return cache?.mockPaymentEnabled !== false
}
