import { PET_SIZE_HEIGHT, type UserSettings } from '../../src/shared/types/settings'
import { IPC } from '../../src/shared/ipc'
import { applyLaunchAtStartup } from './autoLaunch'
import { loadUserSettings, saveUserSettings } from './settingsStore'
import { getAllPetWindows } from './windows'

const PET_WINDOW_SIZE: Record<UserSettings['petSize'], [number, number]> = {
  small: [240, 310],
  medium: [270, 360],
  large: [320, 440]
}

export function applyUserSettings(settings?: UserSettings): UserSettings {
  const next = settings ?? loadUserSettings()
  applyLaunchAtStartup(next.launchAtStartup)

  const [width, height] = PET_WINDOW_SIZE[next.petSize]
  for (const win of getAllPetWindows()) {
    win.setAlwaysOnTop(next.alwaysOnTop)
    win.setSize(width, height)
    win.webContents.send(IPC.settings.changed, {
      petSize: next.petSize,
      petOpacity: next.petOpacity,
      petHeight: PET_SIZE_HEIGHT[next.petSize]
    })
  }

  return next
}

export function persistAndApply(settings: UserSettings): UserSettings {
  saveUserSettings(settings)
  return applyUserSettings(settings)
}
