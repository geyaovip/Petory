import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../../src/shared/types/settings'

const SETTINGS_FILE = 'user-settings.json'

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE)
}

export function loadUserSettings(): UserSettings {
  try {
    const raw = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8')) as Partial<UserSettings>
    return { ...DEFAULT_USER_SETTINGS, ...raw }
  } catch {
    return { ...DEFAULT_USER_SETTINGS }
  }
}

export function saveUserSettings(settings: UserSettings): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

export function patchUserSettings(patch: Partial<UserSettings>): UserSettings {
  const next = { ...loadUserSettings(), ...patch }
  saveUserSettings(next)
  return next
}
