import { Hono } from 'hono'
import type { AuthVariables } from '../middleware/auth.js'
import { requireUser } from '../middleware/auth.js'
import { toPublicUser } from '../services/authService.js'
import { redeemCode } from '../services/redeemService.js'
import { getQuotaView } from '../services/quotaService.js'
import { prisma } from '../lib/prisma.js'

export const redeemRoutes = new Hono<{ Variables: AuthVariables }>()

redeemRoutes.use('*', requireUser)

redeemRoutes.post('/', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ code?: string }>()
  if (!body.code?.trim()) {
    return c.json({ success: false, message: '请输入兑换码。' }, 400)
  }

  const result = await redeemCode(user, body.code)
  if (!result.success) return c.json(result, 400)

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  const quota = await getQuotaView(updated)
  return c.json({
    success: true,
    message: result.message,
    user: await toPublicUser(updated),
    quota
  })
})
