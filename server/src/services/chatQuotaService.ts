import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { todayKey } from '../lib/entitlements.js'
import { getPlanChatLimit } from './systemConfigService.js'
import { logQuotaBlocked } from './auditService.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'

export async function ensureChatQuota(user: User) {
  const today = todayKey()
  const limit = await getPlanChatLimit(user.plan as PlanTier)
  const existing = await prisma.chatQuota.findUnique({ where: { userId: user.id } })
  if (!existing) {
    return prisma.chatQuota.create({
      data: { userId: user.id, dailyLimit: limit, usedToday: 0, resetDate: today }
    })
  }
  if (existing.resetDate !== today) {
    return prisma.chatQuota.update({
      where: { userId: user.id },
      data: { usedToday: 0, resetDate: today, dailyLimit: limit }
    })
  }
  if (existing.dailyLimit !== limit) {
    return prisma.chatQuota.update({
      where: { userId: user.id },
      data: { dailyLimit: limit }
    })
  }
  return existing
}

export async function getChatQuotaView(user: User) {
  const quota = await ensureChatQuota(user)
  const remaining = Math.max(0, quota.dailyLimit + quota.bonusQuota - quota.usedToday)
  return {
    dailyLimit: quota.dailyLimit,
    usedToday: quota.usedToday,
    remainingToday: remaining,
    bonusQuota: quota.bonusQuota,
    totalUsed: quota.totalUsed,
    isProUser: user.plan === 'pro'
  }
}

export async function canConsumeChat(
  user: User
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const quota = await ensureChatQuota(user)
  const remaining = quota.dailyLimit + quota.bonusQuota - quota.usedToday
  if (remaining <= 0) {
    await logQuotaBlocked(user.id, 'chat')
    return {
      ok: false,
      code: 'CHAT_QUOTA_EXCEEDED',
      message: '今日免费对话次数已用完，明天再来或升级 Pro。'
    }
  }
  return { ok: true }
}

export async function consumeChat(userId: string, reason: string): Promise<void> {
  const quota = await prisma.chatQuota.findUnique({ where: { userId } })
  if (!quota) return
  const before = quota.usedToday
  const after = before + 1
  await prisma.$transaction([
    prisma.chatQuota.update({
      where: { userId },
      data: { usedToday: after, totalUsed: quota.totalUsed + 1 }
    }),
    prisma.quotaLog.create({
      data: {
        userId,
        changeType: 'chat_consume',
        amount: -1,
        beforeValue: before,
        afterValue: after,
        reason
      }
    })
  ])
}
