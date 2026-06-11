import type { ReactElement } from 'react'

export function MaintenanceNotice({
  message,
  className = ''
}: {
  message: string
  className?: string
}): ReactElement {
  return (
    <div
      className={[
        'rounded-xl border border-[#F5D0A8] bg-[#FFF8ED] px-3 py-2.5 text-[12px] leading-relaxed text-[#8A5A12]',
        className
      ].join(' ')}
      role="status"
    >
      <p className="font-medium">维护公告</p>
      <p className="mt-1 whitespace-pre-wrap">{message}</p>
    </div>
  )
}
