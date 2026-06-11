import type { ReactElement, ReactNode } from 'react'

interface StyleCardProps {
  title: string
  description: string
  selected?: boolean
  disabled?: boolean
  badges?: ReactNode
  onClick?: () => void
}

export function StyleCard({
  title,
  description,
  selected = false,
  disabled = false,
  badges,
  onClick
}: StyleCardProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'rounded-2xl border p-3 text-left shadow-sm transition-all',
        selected
          ? 'border-petory-primary bg-petory-primary-soft ring-1 ring-petory-primary/20'
          : 'border-petory-border bg-petory-surface',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-petory-primary hover:shadow-md active:scale-[0.99]'
      ].join(' ')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium">{title}</span>
        {badges ? <div className="flex items-center gap-1">{badges}</div> : null}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-petory-text-tertiary">{description}</p>
    </button>
  )
}
