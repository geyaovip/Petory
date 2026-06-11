export function computeProExpiresAt(current: Date | null, durationDays: number): Date {
  const now = new Date()
  const base = current && current > now ? current : now
  const next = new Date(base)
  next.setDate(next.getDate() + durationDays)
  return next
}
