import { prisma } from '../lib/prisma.js'

export async function logAdminAction(input: {
  adminId: string
  adminEmail: string
  action: string
  targetType?: string
  targetId?: string
  detail?: string
}): Promise<void> {
  await prisma.adminAuditLog.create({ data: input })
}

export async function logUserLogin(input: {
  userId: string
  email: string
  ip?: string
  success?: boolean
}): Promise<void> {
  await prisma.userLoginLog.create({
    data: {
      userId: input.userId,
      email: input.email,
      ip: input.ip,
      success: input.success ?? true
    }
  })
}

export async function logQuotaBlocked(
  userId: string,
  kind: 'generation' | 'chat'
): Promise<void> {
  await prisma.quotaLog.create({
    data: {
      userId,
      changeType: 'blocked',
      amount: 0,
      beforeValue: 0,
      afterValue: 0,
      reason: `${kind}_quota_exceeded`
    }
  })
}
