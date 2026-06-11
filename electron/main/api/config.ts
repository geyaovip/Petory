import { loadUserSettings } from '../settingsStore'

export function getApiBaseUrl(): string {
  const fromSettings = loadUserSettings().apiBaseUrl?.trim()
  const raw = fromSettings || process.env['PETORY_API_BASE_URL']?.trim()
  if (!raw) return ''
  return raw.replace(/\/$/, '')
}

export function isRemoteBackendEnabled(): boolean {
  return getApiBaseUrl().length > 0
}
