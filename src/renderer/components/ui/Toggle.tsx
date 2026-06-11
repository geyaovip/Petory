import type { ReactElement } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps): ReactElement {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[14px]">
      <span>
        {label}
        {description ? (
          <span className="mt-0.5 block text-[12px] text-petory-text-tertiary">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={[
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-petory-primary' : 'bg-petory-border'
        ].join(' ')}
        onClick={() => onChange(!checked)}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          ].join(' ')}
        />
      </button>
    </label>
  )
}
