export type PaymentPlanId = 'pro_monthly' | 'pro_yearly'

export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export type PaymentProvider = 'mock'

export interface PaymentPlan {
  id: PaymentPlanId
  name: string
  priceCents: number
  currency: string
  durationDays: number
  description: string
}

export interface PaymentOrderSummary {
  orderId: string
  planId: PaymentPlanId
  planName: string
  amountCents: number
  currency: string
  status: PaymentOrderStatus
  provider: PaymentProvider
  createdAt: string
  paidAt: string | null
}

export type PaymentCheckoutResult =
  | { success: true; order: PaymentOrderSummary }
  | { success: false; message: string }

export type PaymentConfirmResult =
  | { success: true; order: PaymentOrderSummary; state: import('./auth').AuthState }
  | { success: false; message: string }
