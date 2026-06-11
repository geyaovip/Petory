import { PLAN_LIMITS } from '../../../src/shared/entitlements.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'

export function dailyGenerationLimit(plan: PlanTier): number {
  return PLAN_LIMITS[plan].dailyGenerationLimit
}

export function dailyChatLimit(plan: PlanTier): number {
  return PLAN_LIMITS[plan].dailyChatLimit
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
