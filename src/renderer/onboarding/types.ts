export type OnboardingStep =
  | 'welcome'
  | 'upload'
  | 'generating'
  | 'result'
  | 'naming'
  | 'error'

export type OnboardingErrorCode =
  | 'upload_invalid'
  | 'generation_failed'
  | 'rembg_failed'
  | 'quota_exceeded'
  | 'style_locked'
  | 'auth_expired'
  | 'service_disabled'
  | 'network_error'
  | 'rate_limit'
