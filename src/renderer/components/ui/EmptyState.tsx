import type { ReactElement, ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  children
}: EmptyStateProps): ReactElement {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-petory-primary-soft opacity-60" />
      <p className="text-[15px] font-medium text-petory-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-petory-text-secondary">
          {description}
        </p>
      ) : null}
      {children}
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
