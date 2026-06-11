import type { PetStyleType } from './pet'

export type SedentaryInterval = 30 | 45 | 60 | 90
export type PetSizePreset = 'small' | 'medium' | 'large'

export interface UserSettings {
  enableChatHistory: boolean
  focusDuration: number
  breakDuration: number
  autoNextRound: boolean
  enableSedentaryReminder: boolean
  sedentaryInterval: SedentaryInterval
  enablePomodoroReminder: boolean
  launchAtStartup: boolean
  alwaysOnTop: boolean
  petSize: PetSizePreset
  petOpacity: number
  enableSound: boolean
  /** 后台 API 根地址；优先于 .env 中的 PETORY_API_BASE_URL */
  apiBaseUrl: string
  minimaxApiKey: string
  kimiApiKey: string
  featureGuideCompleted: boolean
  enableCrashReporting: boolean
  lastSelectedStyle: PetStyleType
}

export const PET_SIZE_HEIGHT: Record<PetSizePreset, number> = {
  small: 150,
  medium: 200,
  large: 280
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  enableChatHistory: true,
  focusDuration: 25,
  breakDuration: 5,
  autoNextRound: true,
  enableSedentaryReminder: true,
  sedentaryInterval: 60,
  enablePomodoroReminder: true,
  launchAtStartup: false,
  alwaysOnTop: true,
  petSize: 'medium',
  petOpacity: 1,
  enableSound: false,
  apiBaseUrl: '',
  minimaxApiKey: '',
  kimiApiKey: '',
  featureGuideCompleted: false,
  enableCrashReporting: true,
  lastSelectedStyle: 'petory'
}
