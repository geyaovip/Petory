import { PAYMENT_PLANS, getPaymentPlan } from '../../../src/shared/paymentPlans'
import type { PaymentPlan, PaymentPlanId } from '../../../src/shared/types/payment'
import type { ServerAuthUser } from '../../../src/shared/types/api'
import { apiFetch, apiFetchPublic } from '../api/client'
import { isRemoteBackendEnabled } from '../api/config'
import { refreshAppStatus } from '../api/appStatus'
import { applyQuotaFromResponse } from '../api/remoteQuotaStore'
import { buildAuthState } from '../auth/entitlementService'
import { loadSession, saveSession, updateMockUserPlan } from '../auth/authStore'
import { computeProExpiresAt } from './subscriptionLocal'

export type PaymentActionResult =
  | { success: true; state: ReturnType<typeof buildAuthState> }
  | { success: false; message: string }

export function getLocalPaymentPlans(): PaymentPlan[] {
  return PAYMENT_PLANS
}

export async function fetchPaymentPlans(): Promise<PaymentPlan[]> {
  if (!isRemoteBackendEnabled()) return getLocalPaymentPlans()
  const data = await apiFetchPublic<{ plans: PaymentPlan[] }>('/api/payment/plans')
  return data.plans
}

export async function purchaseProMock(planId: PaymentPlanId): Promise<PaymentActionResult> {
  const plan = getPaymentPlan(planId)
  if (!plan) return { success: false, message: '无效的订阅方案。' }

  if (!isRemoteBackendEnabled()) {
    return purchaseProMockLocal(plan)
  }

  const session = loadSession()
  if (!session) return { success: false, message: '请先登录。' }

  try {
    const checkout = await apiFetch<{ success: boolean; order?: { orderId: string }; message?: string }>(
      '/api/payment/checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      }
    )
    if (!checkout.success || !checkout.order?.orderId) {
      return { success: false, message: checkout.message || '创建订单失败。' }
    }

    const confirmed = await apiFetch<{
      success: boolean
      user?: ServerAuthUser
      quota?: unknown
      chatQuota?: unknown
      message?: string
    }>('/api/payment/mock/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: checkout.order.orderId })
    })

    if (!confirmed.success || !confirmed.user) {
      return { success: false, message: confirmed.message || '支付确认失败。' }
    }

    saveSession({
      ...session,
      user: {
        id: confirmed.user.id,
        email: confirmed.user.email,
        displayName: confirmed.user.displayName,
        plan: confirmed.user.plan,
        proExpiresAt: confirmed.user.proExpiresAt ?? null,
        createdAt: confirmed.user.createdAt
      }
    })
    applyQuotaFromResponse({
      userLimits: confirmed.user.limits,
      quota: confirmed.quota as never,
      chatQuota: confirmed.chatQuota as never
    })
    await refreshAppStatus(true)
    return { success: true, state: buildAuthState() }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '支付失败，请稍后再试。'
    }
  }
}

function purchaseProMockLocal(plan: PaymentPlan): PaymentActionResult {
  const session = loadSession()
  if (!session) return { success: false, message: '请先登录。' }

  const currentExpiry = session.user.proExpiresAt
    ? new Date(session.user.proExpiresAt)
    : null
  const proExpiresAt = computeProExpiresAt(currentExpiry, plan.durationDays).toISOString()

  updateMockUserPlan(session.user.id, 'pro')
  saveSession({
    ...session,
    user: {
      ...session.user,
      plan: 'pro',
      proExpiresAt
    }
  })
  return { success: true, state: buildAuthState() }
}
