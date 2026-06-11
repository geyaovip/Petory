import type { User } from '@prisma/client'
import { PAYMENT_PLANS, getPaymentPlan } from '../../../src/shared/paymentPlans.js'
import type { PaymentPlanId } from '../../../src/shared/types/payment.js'
import { prisma } from '../lib/prisma.js'
import { toPublicUser } from './authService.js'
import { getSystemConfig } from './systemConfigService.js'
import { activateProSubscription } from './subscriptionService.js'

function serializeOrder(order: {
  id: string
  planId: string
  amountCents: number
  currency: string
  status: string
  provider: string
  createdAt: Date
  paidAt: Date | null
}) {
  const plan = getPaymentPlan(order.planId as PaymentPlanId)
  return {
    orderId: order.id,
    planId: order.planId,
    planName: plan?.name ?? order.planId,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    provider: order.provider,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null
  }
}

export function listPaymentPlans() {
  return PAYMENT_PLANS
}

export async function assertPaymentAvailable(): Promise<
  { ok: true; mock: boolean } | { ok: false; message: string }
> {
  const cfg = await getSystemConfig()
  if (!cfg.paymentEnabled) {
    return { ok: false, message: '支付功能暂未开放。' }
  }
  if (!cfg.mockPaymentEnabled) {
    return { ok: false, message: '演示支付已关闭，请等待正式支付上线。' }
  }
  return { ok: true, mock: true }
}

export async function createCheckout(user: User, planId: PaymentPlanId) {
  const gate = await assertPaymentAvailable()
  if (!gate.ok) return { success: false as const, message: gate.message }

  const plan = getPaymentPlan(planId)
  if (!plan) {
    return { success: false as const, message: '无效的订阅方案。' }
  }

  const order = await prisma.paymentOrder.create({
    data: {
      userId: user.id,
      planId: plan.id,
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: 'pending',
      provider: 'mock'
    }
  })

  return { success: true as const, order: serializeOrder(order) }
}

export async function confirmMockPayment(user: User, orderId: string) {
  const gate = await assertPaymentAvailable()
  if (!gate.ok) return { success: false as const, message: gate.message }

  const order = await prisma.paymentOrder.findFirst({
    where: { id: orderId, userId: user.id }
  })
  if (!order) {
    return { success: false as const, message: '订单不存在。' }
  }
  if (order.status === 'paid') {
    return { success: false as const, message: '订单已支付。' }
  }
  if (order.status !== 'pending') {
    return { success: false as const, message: '订单状态不可支付。' }
  }

  const plan = getPaymentPlan(order.planId as PaymentPlanId)
  if (!plan) {
    return { success: false as const, message: '订阅方案已失效。' }
  }

  const paidAt = new Date()
  await prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: 'paid', paidAt }
  })

  const updatedUser = await activateProSubscription(user, plan.durationDays)
  const paidOrder = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } })

  return {
    success: true as const,
    order: serializeOrder(paidOrder),
    user: await toPublicUser(updatedUser)
  }
}

export async function listUserPaymentOrders(userId: string) {
  const orders = await prisma.paymentOrder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  return orders.map(serializeOrder)
}

export async function listAdminPaymentOrders(skip: number, take: number) {
  const orders = await prisma.paymentOrder.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    include: {
      user: { select: { email: true, displayName: true } }
    }
  })
  return orders.map((order) => ({
    ...serializeOrder(order),
    userEmail: order.user.email,
    userName: order.user.displayName
  }))
}

export async function countAdminPaymentOrders() {
  return prisma.paymentOrder.count()
}
