import type { ReactElement } from 'react'

interface PanelLoadingProps {
  label?: string
}

export function PanelLoading({ label = '加载中…' }: PanelLoadingProps): ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-petory-bg px-6 text-center">
      <div className="h-10 w-10 animate-pulse rounded-full bg-petory-primary-soft" />
      <p className="text-[14px] text-petory-text-secondary">{label}</p>
    </div>
  )
}
