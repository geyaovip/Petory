import type { ReactElement } from 'react'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  trackClassName?: string
  progressClassName?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 8,
  trackClassName = 'stroke-petory-border',
  progressClassName = 'stroke-petory-accent',
  children
}: ProgressRingProps): ReactElement {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={[progressClassName, 'transition-[stroke-dashoffset] duration-1000 ease-linear'].join(
            ' '
          )}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      ) : null}
    </div>
  )
}
