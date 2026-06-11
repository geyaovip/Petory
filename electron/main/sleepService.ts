import { getActivePet } from './petStore'
import { getPetVisualState, setPetVisualState } from './petStateService'

let lastActivityAt = Date.now()
let sleepTimer: ReturnType<typeof setInterval> | null = null

const DAY_IDLE_MS = 20 * 60 * 1000
const NIGHT_IDLE_MS = 10 * 60 * 1000

function isNightHour(): boolean {
  const hour = new Date().getHours()
  return hour >= 22 || hour < 7
}

function sleepThresholdMs(): number {
  return isNightHour() ? NIGHT_IDLE_MS : DAY_IDLE_MS
}

export function touchActivity(): void {
  lastActivityAt = Date.now()
  if (getPetVisualState() === 'sleep') {
    setPetVisualState('idle')
  }
}

function checkSleep(): void {
  const pet = getActivePet()
  if (!pet) return

  const visual = getPetVisualState()
  if (visual !== 'idle') return

  if (Date.now() - lastActivityAt < sleepThresholdMs()) return

  setPetVisualState('sleep')
}

export function startSleepService(): void {
  if (sleepTimer) return
  lastActivityAt = Date.now()
  sleepTimer = setInterval(() => checkSleep(), 60_000)
}

export function stopSleepService(): void {
  if (sleepTimer) {
    clearInterval(sleepTimer)
    sleepTimer = null
  }
}
