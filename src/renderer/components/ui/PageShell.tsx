import type { ReactElement, ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className = '' }: PageShellProps): ReactElement {
  return (
    <div
      className={`flex min-h-full flex-col bg-petory-bg px-6 py-8 text-petory-text ${className}`}
    >
      {children}
    </div>
  )
}
