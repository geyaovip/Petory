import { Hono } from 'hono'
import type { AuthVariables } from '../middleware/auth.js'
import { requireUser } from '../middleware/auth.js'
import type { PaymentPlanId } from '../../../src/shared/types/payment.js'
import {
  confirmMockPayment,
  createCheckout,
  listPaymentPlans,
  listUserPaymentOrders
} from '../services/paymentService.js'
import { getChatQuotaView } from '../services/chatQuotaService.js'
import { getQuotaView } from '../services/quotaService.js'

export const paymentRoutes = new Hono<{ Variables: AuthVariables }>()

paymentRoutes.get('/plans', (c) => {
  return c.json({ plans: listPaymentPlans() })
})

const authed = new Hono<{ Variables: AuthVariables }>()
authed.use('*', requireUser)

authed.post('/checkout', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ planId?: PaymentPlanId }>()
  if (!body.planId) {
    return c.json({ success: false, message: '请选择订阅方案。' }, 400)
  }
  const result = await createCheckout(user, body.planId)
  if (!result.success) return c.json(result, 400)
  return c.json(result)
})

authed.post('/mock/confirm', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ orderId?: string }>()
  if (!body.orderId) {
    return c.json({ success: false, message: '缺少订单号。' }, 400)
  }
  const result = await confirmMockPayment(user, body.orderId)
  if (!result.success) return c.json(result, 400)

  const quota = await getQuotaView(user)
  const chatQuota = await getChatQuotaView(user)
  return c.json({
    success: true,
    order: result.order,
    user: result.user,
    quota,
    chatQuota
  })
})

authed.get('/orders', async (c) => {
  const user = c.get('user')!
  const orders = await listUserPaymentOrders(user.id)
  return c.json({ orders })
})

paymentRoutes.route('/', authed)
