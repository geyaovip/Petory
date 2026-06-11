import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'
import { ensureChatQuota } from './chatQuotaService.js'
import { ensureQuota } from './quotaService.js'

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function redeemCode(user: User, rawCode: string) {
  if (user.status !== 'active') {
    return { success: false as const, message: '账号不可用。' }
  }

  const code = normalizeCode(rawCode)
  const record = await prisma.redeemCode.findUnique({ where: { code } })
  if (!record || !record.active) {
    return { success: false as const, message: '兑换码无效。' }
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { success: false as const, message: '兑换码已过期。' }
  }
  if (record.usedCount >= record.maxUses) {
    return { success: false as const, message: '兑换码已用完。' }
  }

  const already = await prisma.redeemLog.findFirst({
    where: { codeId: record.id, userId: user.id }
  })
  if (already) {
    return { success: false as const, message: '你已使用过该兑换码。' }
  }

  const plan = record.plan as PlanTier
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { plan, proExpiresAt: null }
    }),
    prisma.redeemCode.update({
      where: { id: record.id },
      data: { usedCount: record.usedCount + 1 }
    }),
    prisma.redeemLog.create({
      data: { codeId: record.id, userId: user.id }
    })
  ])

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  await Promise.all([ensureQuota(updated), ensureChatQuota(updated)])

  return {
    success: true as const,
    plan: updated.plan,
    message: '兑换成功，已开通 Pro 权益。'
  }
}

export async function createRedeemCode(input: {
  code: string
  plan?: PlanTier
  maxUses?: number
  expiresAt?: string | null
  note?: string
}) {
  const code = normalizeCode(input.code)
  const existing = await prisma.redeemCode.findUnique({ where: { code } })
  if (existing) {
    return { success: false as const, message: '兑换码已存在。' }
  }

  const record = await prisma.redeemCode.create({
    data: {
      code,
      plan: input.plan ?? 'pro',
      maxUses: input.maxUses ?? 1,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      note: input.note
    }
  })

  return { success: true as const, code: record }
}

export async function listRedeemCodes(skip: number, take: number) {
  const codes = await prisma.redeemCode.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })
  return codes.map((c) => ({
    id: c.id,
    code: c.code,
    plan: c.plan,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    remaining: Math.max(0, c.maxUses - c.usedCount),
    active: c.active,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    note: c.note,
    createdAt: c.createdAt.toISOString()
  }))
}

export async function countRedeemCodes() {
  return prisma.redeemCode.count()
}
