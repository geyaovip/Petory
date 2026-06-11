import type { PaymentPlan, PaymentPlanId } from './types/payment'

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'pro_monthly',
    name: 'Pro 月付',
    priceCents: 1800,
    currency: 'CNY',
    durationDays: 30,
    description: '6 种姿势、多风格、最多 5 只桌宠并行，更高每日额度'
  },
  {
    id: 'pro_yearly',
    name: 'Pro 年付',
    priceCents: 16800,
    currency: 'CNY',
    durationDays: 365,
    description: '与月付相同权益，年付更省（演示定价，后续接真支付）'
  }
]

export function getPaymentPlan(id: PaymentPlanId): PaymentPlan | undefined {
  return PAYMENT_PLANS.find((plan) => plan.id === id)
}

export function formatPlanPrice(plan: PaymentPlan): string {
  const yuan = plan.priceCents / 100
  return `¥${Number.isInteger(yuan) ? yuan : yuan.toFixed(2)}`
}
