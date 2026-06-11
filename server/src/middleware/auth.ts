import type { Context, Next } from 'hono'
import { prisma } from '../lib/prisma.js'
import { verifyToken, type TokenPayload } from '../lib/jwt.js'
import { assertDeviceAllowed } from '../services/deviceGuardService.js'
import { resolveUserSubscription } from '../services/subscriptionService.js'

export type AuthVariables = {
  token: TokenPayload
  user?: Awaited<ReturnType<typeof prisma.user.findUnique>>
  admin?: Awaited<ReturnType<typeof prisma.adminUser.findUnique>>
}

function parseBearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

export async function requireUser(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const raw = parseBearer(c.req.header('Authorization'))
  if (!raw) return c.json({ success: false, message: '未登录。' }, 401)
  try {
    const token = verifyToken(raw)
    if (token.role !== 'user') return c.json({ success: false, message: '无权限。' }, 403)
    const rawUser = await prisma.user.findUnique({ where: { id: token.sub } })
    if (!rawUser) return c.json({ success: false, message: '用户不存在。' }, 401)
    const user = await resolveUserSubscription(rawUser)
    const deviceId = c.req.header('x-petory-device-id')
    const deviceCheck = await assertDeviceAllowed(user.id, deviceId)
    if (!deviceCheck.ok) {
      return c.json(
        { success: false, code: deviceCheck.code, message: deviceCheck.message },
        403
      )
    }
    c.set('token', token)
    c.set('user', user)
    await next()
  } catch {
    return c.json({ success: false, message: '登录已过期，请重新登录。' }, 401)
  }
}

export async function requireAdminWrite(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const admin = c.get('admin')
  if (!admin) return c.json({ success: false, message: '未登录。' }, 401)
  if (admin.role === 'operator') {
    return c.json({ success: false, message: '只读账号无写入权限。' }, 403)
  }
  await next()
}

export async function requireAdmin(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const raw = parseBearer(c.req.header('Authorization'))
  if (!raw) return c.json({ success: false, message: '未登录。' }, 401)
  try {
    const token = verifyToken(raw)
    if (token.role !== 'admin') return c.json({ success: false, message: '无权限。' }, 403)
    const admin = await prisma.adminUser.findUnique({ where: { id: token.sub } })
    if (!admin || admin.status !== 'active') {
      return c.json({ success: false, message: '管理员不可用。' }, 403)
    }
    c.set('token', token)
    c.set('admin', admin)
    await next()
  } catch {
    return c.json({ success: false, message: '登录已过期。' }, 401)
  }
}
