import type { ReactElement } from 'react'
import { TextButton } from './TextButton'

interface PanelHeaderProps {
  title: string
  subtitle?: string
  onClose?: () => void
  closeLabel?: string
  className?: string
}

export function PanelHeader({
  title,
  subtitle,
  onClose,
  closeLabel = '关闭',
  className = ''
}: PanelHeaderProps): ReactElement {
  return (
    <header className={`flex items-start justify-between gap-3 pt-6 ${className}`}>
      <div>
        <h1 className="text-[18px] font-semibold leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-[12px] text-petory-text-tertiary">{subtitle}</p>
        ) : null}
      </div>
      {onClose ? <TextButton onClick={onClose}>{closeLabel}</TextButton> : null}
    </header>
  )
}
