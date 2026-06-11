import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signToken } from '../lib/jwt.js'
import { PLAN_LIMITS } from '../../../src/shared/entitlements.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'
import { logAdminAction, logUserLogin } from './auditService.js'
import { resolveUserSubscription } from './subscriptionService.js'
import { ensureChatQuota } from './chatQuotaService.js'
import { ensureQuota } from './quotaService.js'
import { getPublicAppStatus, getSystemConfig } from './systemConfigService.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function registerUser(
  input: {
    email: string
    password: string
    displayName?: string
  },
  meta?: { ip?: string }
) {
  const sys = await getSystemConfig()
  if (!sys.registrationOpen) {
    return { success: false as const, message: '当前暂未开放注册。' }
  }
  const email = normalizeEmail(input.email)
  if (!EMAIL_RE.test(email)) {
    return { success: false as const, message: '请输入有效的邮箱地址。' }
  }
  if (input.password.length < 6) {
    return { success: false as const, message: '密码至少 6 位。' }
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return { success: false as const, message: '该邮箱已注册，请直接登录。' }
  }

  const displayName = input.displayName?.trim() || email.split('@')[0] || 'Petory 用户'
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      displayName
    }
  })
  await Promise.all([ensureQuota(user), ensureChatQuota(user)])
  await logUserLogin({ userId: user.id, email: user.email, ip: meta?.ip })

  const token = signToken({ sub: user.id, role: 'user', email: user.email })
  return { success: true as const, accessToken: token, user: await toPublicUser(user) }
}

export async function loginUser(
  input: { email: string; password: string },
  meta?: { ip?: string }
) {
  const email = normalizeEmail(input.email)
  if (!EMAIL_RE.test(email)) {
    return { success: false as const, message: '请输入有效的邮箱地址。' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { success: false as const, message: '账号不存在，请先注册。' }
  }
  if (user.status !== 'active') {
    return { success: false as const, message: '账号已被禁用。' }
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    await logUserLogin({ userId: user.id, email: user.email, ip: meta?.ip, success: false })
    return { success: false as const, message: '邮箱或密码不正确。' }
  }

  const touched = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })
  const updated = await resolveUserSubscription(touched)
  await Promise.all([ensureQuota(updated), ensureChatQuota(updated)])
  await logUserLogin({ userId: updated.id, email: updated.email, ip: meta?.ip })

  const token = signToken({ sub: updated.id, role: 'user', email: updated.email })
  return { success: true as const, accessToken: token, user: await toPublicUser(updated) }
}

export async function loginAdmin(
  input: { email: string; password: string },
  meta?: { ip?: string }
) {
  const email = normalizeEmail(input.email)
  const admin = await prisma.adminUser.findUnique({ where: { email } })
  if (!admin || admin.status !== 'active') {
    return { success: false as const, message: '管理员账号或密码不正确。' }
  }
  if (!(await verifyPassword(input.password, admin.passwordHash))) {
    return { success: false as const, message: '管理员账号或密码不正确。' }
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  })

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'admin_login',
    detail: meta?.ip ? `ip=${meta.ip}` : undefined
  })

  const token = signToken({ sub: admin.id, role: 'admin', email: admin.email })
  return {
    success: true as const,
    accessToken: token,
    admin: { id: admin.id, email: admin.email, role: admin.role }
  }
}

export async function toPublicUser(user: {
  id: string
  email: string
  displayName: string
  plan: string
  status: string
  proExpiresAt: Date | null
  createdAt: Date
}) {
  const plan = user.plan as PlanTier
  const cfg = await getSystemConfig()
  const dynamic = getPublicAppStatus(cfg).limits[plan]
  const limits = {
    ...PLAN_LIMITS[plan],
    dailyGenerationLimit: dynamic.dailyGenerationLimit,
    dailyChatLimit: dynamic.dailyChatLimit
  }
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    plan,
    status: user.status,
    proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    limits
  }
}
