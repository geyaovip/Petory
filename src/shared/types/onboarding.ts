export type OnboardingIntent =
  | { mode: 'new' }
  | { mode: 'replace' }
  | { mode: 'restyle'; petId: string }
