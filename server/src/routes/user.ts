import { Hono } from 'hono'
import type { AuthVariables } from '../middleware/auth.js'
import { requireUser } from '../middleware/auth.js'
import { toPublicUser } from '../services/authService.js'
import { getChatQuotaView } from '../services/chatQuotaService.js'
import { getQuotaView } from '../services/quotaService.js'
import { assertDeviceAllowed } from '../services/deviceGuardService.js'
import { prisma } from '../lib/prisma.js'

export const userRoutes = new Hono<{ Variables: AuthVariables }>()

userRoutes.use('*', requireUser)

userRoutes.get('/me', async (c) => {
  const user = c.get('user')!
  const [quota, chatQuota] = await Promise.all([getQuotaView(user), getChatQuotaView(user)])
  return c.json({
    user: await toPublicUser(user),
    quota,
    chatQuota
  })
})

userRoutes.post('/devices/register', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{
    localDeviceId?: string
    deviceName?: string
    os?: string
    osVersion?: string
    appVersion?: string
  }>()
  if (!body.localDeviceId) {
    return c.json({ success: false, message: '缺少 localDeviceId。' }, 400)
  }

  const deviceCheck = await assertDeviceAllowed(user.id, body.localDeviceId)
  if (!deviceCheck.ok) {
    return c.json({ success: false, code: deviceCheck.code, message: deviceCheck.message }, 403)
  }

  const device = await prisma.device.upsert({
    where: {
      userId_localDeviceId: { userId: user.id, localDeviceId: body.localDeviceId }
    },
    create: {
      userId: user.id,
      localDeviceId: body.localDeviceId,
      deviceName: body.deviceName,
      os: body.os,
      osVersion: body.osVersion,
      appVersion: body.appVersion
    },
    update: {
      deviceName: body.deviceName,
      os: body.os,
      osVersion: body.osVersion,
      appVersion: body.appVersion,
      lastActiveAt: new Date()
    }
  })

  return c.json({ success: true, deviceId: device.id })
})
