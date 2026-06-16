export type OnboardingIntent =
  | { mode: 'new'; returnTo?: 'pets' }
  | { mode: 'replace'; returnTo?: 'pets' }
  | { mode: 'restyle'; petId: string; returnTo?: 'pets' }
  /** Resume naming after generation completed while onboarding was closed. */
  | { mode: 'finalize'; petId: string; returnTo?: 'pets' }
