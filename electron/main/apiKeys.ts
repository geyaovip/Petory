import { loadUserSettings } from './settingsStore'

export function getArkApiKey(): string {
  const settings = loadUserSettings()
  return settings.arkApiKey || process.env['ARK_API_KEY'] || ''
}

export function getKimiApiKey(): string {
  const settings = loadUserSettings()
  return settings.kimiApiKey || process.env['KIMI_API_KEY'] || ''
}
