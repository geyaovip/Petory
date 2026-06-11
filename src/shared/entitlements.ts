import type { EntitlementLimits, PlanTier } from './types/auth'

export const PLAN_LIMITS: Record<PlanTier, EntitlementLimits> = {
  free: {
    maxPets: 1,
    maxDesktopPets: 1,
    dailyChatLimit: 20,
    dailyGenerationLimit: 3,
    multiPet: false
  },
  pro: {
    maxPets: 10,
    maxDesktopPets: 5,
    dailyChatLimit: 9999,
    dailyGenerationLimit: 50,
    multiPet: true
  }
}

/** Mock redeem codes — replace with server validation in real auth. */
export const MOCK_REDEEM_CODES: Record<string, PlanTier> = {
  'PETORY-PRO-DEMO': 'pro',
  'PETORY-PRO-TEST': 'pro'
}
