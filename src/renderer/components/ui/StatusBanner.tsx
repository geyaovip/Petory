import type { ReactElement } from 'react'

export type StatusVariant = 'success' | 'error' | 'info'

const VARIANT_CLASS: Record<StatusVariant, string> = {
  success: 'bg-petory-success-soft text-petory-success',
  error: 'bg-petory-error-soft text-petory-text',
  info: 'bg-petory-accent-soft text-petory-text-secondary'
}

interface StatusBannerProps {
  message: string
  variant?: StatusVariant
  className?: string
}

export function StatusBanner({
  message,
  variant = 'info',
  className = ''
}: StatusBannerProps): ReactElement {
  return (
    <p
      className={[
        'rounded-lg px-3 py-2 text-[12px] leading-relaxed',
        VARIANT_CLASS[variant],
        className
      ].join(' ')}
      role="status"
    >
      {message}
    </p>
  )
}
