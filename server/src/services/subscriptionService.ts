import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { ensureChatQuota } from './chatQuotaService.js'
import { ensureQuota } from './quotaService.js'

export function computeProExpiresAt(current: Date | null | undefined, durationDays: number): Date {
  const now = new Date()
  const base = current && current > now ? current : now
  const next = new Date(base)
  next.setDate(next.getDate() + durationDays)
  return next
}

export async function downgradeExpiredPro(user: User): Promise<User> {
  if (user.plan !== 'pro' || !user.proExpiresAt) return user
  if (user.proExpiresAt >= new Date()) return user

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'free' }
  })
  await Promise.all([ensureQuota(updated), ensureChatQuota(updated)])
  return updated
}

export async function resolveUserSubscription(user: User): Promise<User> {
  return downgradeExpiredPro(user)
}

export async function activateProSubscription(
  user: User,
  durationDays: number
): Promise<User> {
  const proExpiresAt = computeProExpiresAt(user.proExpiresAt, durationDays)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'pro', proExpiresAt }
  })
  await Promise.all([ensureQuota(updated), ensureChatQuota(updated)])
  return updated
}
