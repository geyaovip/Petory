import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { todayKey } from '../lib/entitlements.js'
import { getPlanGenerationLimit } from './systemConfigService.js'
import { logQuotaBlocked } from './auditService.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'

export async function ensureQuota(user: User) {
  const today = todayKey()
  const limit = await getPlanGenerationLimit(user.plan as PlanTier)
  const existing = await prisma.generationQuota.findUnique({ where: { userId: user.id } })
  if (!existing) {
    return prisma.generationQuota.create({
      data: {
        userId: user.id,
        dailyLimit: limit,
        usedToday: 0,
        resetDate: today
      }
    })
  }
  if (existing.resetDate !== today) {
    return prisma.generationQuota.update({
      where: { userId: user.id },
      data: {
        usedToday: 0,
        resetDate: today,
        dailyLimit: limit
      }
    })
  }
  if (existing.dailyLimit !== limit) {
    return prisma.generationQuota.update({
      where: { userId: user.id },
      data: { dailyLimit: limit }
    })
  }
  return existing
}

export async function getQuotaView(user: User) {
  const quota = await ensureQuota(user)
  const remaining = Math.max(0, quota.dailyLimit + quota.bonusQuota - quota.usedToday)
  return {
    dailyLimit: quota.dailyLimit,
    usedToday: quota.usedToday,
    remainingToday: remaining,
    bonusQuota: quota.bonusQuota,
    totalUsed: quota.totalUsed,
    isProUser: false
  }
}

export async function canConsumeGeneration(user: User): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const quota = await ensureQuota(user)
  const remaining = quota.dailyLimit + quota.bonusQuota - quota.usedToday
  if (remaining <= 0) {
    await logQuotaBlocked(user.id, 'generation')
    return {
      ok: false,
      code: 'QUOTA_EXCEEDED',
      message: '今日生成次数已用完，请明天再来。'
    }
  }
  return { ok: true }
}

export async function consumeGeneration(userId: string, reason: string): Promise<void> {
  const quota = await prisma.generationQuota.findUnique({ where: { userId } })
  if (!quota) return
  const before = quota.usedToday
  const after = before + 1
  await prisma.$transaction([
    prisma.generationQuota.update({
      where: { userId },
      data: { usedToday: after, totalUsed: quota.totalUsed + 1 }
    }),
    prisma.quotaLog.create({
      data: {
        userId,
        changeType: 'consume',
        amount: -1,
        beforeValue: before,
        afterValue: after,
        reason
      }
    })
  ])
}

export async function grantQuota(userId: string, amount: number, operatorId: string, reason: string) {
  await ensureQuota(await prisma.user.findUniqueOrThrow({ where: { id: userId } }))
  const quota = await prisma.generationQuota.findUniqueOrThrow({ where: { userId } })
  const after = quota.bonusQuota + amount
  await prisma.$transaction([
    prisma.generationQuota.update({
      where: { userId },
      data: { bonusQuota: after }
    }),
    prisma.quotaLog.create({
      data: {
        userId,
        changeType: 'grant',
        amount,
        beforeValue: quota.bonusQuota,
        afterValue: after,
        reason,
        operatorId
      }
    })
  ])
}
