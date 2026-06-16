const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000

/** Calendar date in Asia/Shanghai (UTC+8), e.g. 2026-06-13 */
export function beijingTodayKey(): string {
  const beijing = new Date(Date.now() + BEIJING_OFFSET_MS)
  return beijing.toISOString().slice(0, 10)
}

/** UTC instant for 00:00:00 on a Beijing calendar day (0 = today, 1 = yesterday, …). */
export function beijingDayStartUtc(offsetDaysFromToday: number): Date {
  const [year, month, day] = beijingTodayKey().split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - BEIJING_OFFSET_MS)
  start.setUTCDate(start.getUTCDate() - offsetDaysFromToday)
  return start
}

/** Beijing calendar date label for a day offset (for charts). */
export function beijingDateKey(offsetDaysFromToday: number): string {
  const start = beijingDayStartUtc(offsetDaysFromToday)
  return new Date(start.getTime() + BEIJING_OFFSET_MS).toISOString().slice(0, 10)
}
