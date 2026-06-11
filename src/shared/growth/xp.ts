export const XP_REWARDS = {
  pomodoroComplete: 10,
  dailyFirstOpen: 5,
  chat: 2,
  consecutiveDay: 5
} as const

export function levelFromExp(exp: number): number {
  if (exp >= 500) return 5
  if (exp >= 300) return 4
  if (exp >= 150) return 3
  if (exp >= 50) return 2
  return 1
}

export function expThresholdForLevel(level: number): number {
  const map: Record<number, number> = { 1: 0, 2: 50, 3: 150, 4: 300, 5: 500 }
  return map[level] ?? 0
}

export function nextLevelExp(level: number): number | null {
  const map: Record<number, number | null> = { 1: 50, 2: 150, 3: 300, 4: 500, 5: null }
  return map[level] ?? null
}

export function expProgress(exp: number): {
  level: number
  current: number
  next: number | null
  percent: number
} {
  const level = levelFromExp(exp)
  const floor = expThresholdForLevel(level)
  const next = nextLevelExp(level)
  if (next === null) {
    return { level, current: exp, next: null, percent: 100 }
  }
  const percent = Math.min(100, Math.round(((exp - floor) / (next - floor)) * 100))
  return { level, current: exp, next, percent }
}
