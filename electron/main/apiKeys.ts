import { loadUserSettings } from './settingsStore'

export function getMinimaxApiKey(): string {
  const settings = loadUserSettings()
  return settings.minimaxApiKey || process.env['MINIMAX_API_KEY'] || ''
}

export function getKimiApiKey(): string {
  const settings = loadUserSettings()
  return settings.kimiApiKey || process.env['KIMI_API_KEY'] || ''
}
