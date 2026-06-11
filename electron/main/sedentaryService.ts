import { loadUserSettings } from './settingsStore'
import { getPetStats, updatePetStats } from './statsStore'
import { getActivePet } from './petStore'
import { notifyBubble, setPetVisualState, getPetVisualState } from './petStateService'
import { touchActivity } from './sleepService'

let sedentaryTimer: ReturnType<typeof setInterval> | null = null
let lastActivityAt = Date.now()

const REMIND_TEXT = '你已经坐了好一会儿啦，要不要起来接杯水？我在这里等你。'

function getIntervalMs(): number {
  const settings = loadUserSettings()
  return settings.sedentaryInterval * 60 * 1000
}

function checkSedentary(): void {
  const settings = loadUserSettings()
  if (!settings.enableSedentaryReminder) return

  const pet = getActivePet()
  if (!pet) return

  const elapsed = Date.now() - lastActivityAt
  if (elapsed < getIntervalMs()) return

  const visual = getPetVisualState()
  if (visual === 'focus') return

  if (visual === 'remind') {
    const stats = getPetStats(pet.id)
    const skipCount = stats.sedentarySkipCount + 1
    updatePetStats(pet.id, { sedentarySkipCount: skipCount })
    if (skipCount >= 3) {
      setPetVisualState('angry', 4000)
      updatePetStats(pet.id, { sedentarySkipCount: 0 })
    }
    return
  }

  setPetVisualState('remind')
  notifyBubble({ text: REMIND_TEXT, priority: 'high' })
  updatePetStats(pet.id, { lastSedentaryAt: Date.now() })
}

export function resetSedentaryTimer(): void {
  touchActivity()
  lastActivityAt = Date.now()
  const pet = getActivePet()
  if (pet) {
    updatePetStats(pet.id, { sedentarySkipCount: 0 })
  }
}

export function confirmSedentaryRest(): void {
  resetSedentaryTimer()
  setPetVisualState('happy', 5000)
  notifyBubble({ text: '好好休息～回来我继续陪你。', priority: 'normal' })
}

export function startSedentaryService(): void {
  if (sedentaryTimer) return
  resetSedentaryTimer()
  sedentaryTimer = setInterval(() => checkSedentary(), 30_000)
}

export function stopSedentaryService(): void {
  if (sedentaryTimer) {
    clearInterval(sedentaryTimer)
    sedentaryTimer = null
  }
}
