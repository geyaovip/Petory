import type { OnboardingIntent } from '../../src/shared/types/onboarding'

let pendingIntent: OnboardingIntent | null = null

export function setOnboardingIntent(intent: OnboardingIntent | null): void {
  pendingIntent = intent
}

export function consumeOnboardingIntent(): OnboardingIntent | null {
  const intent = pendingIntent
  pendingIntent = null
  return intent
}
