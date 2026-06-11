import type { BubblePriority } from '@shared/types/growth'
import type { BubblePhase } from '../hooks/useSpeechBubble'

interface SpeechBubbleProps {
  text: string
  phase: BubblePhase
  priority?: BubblePriority
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick?: () => void
}

export function SpeechBubble({
  text,
  phase,
  priority = 'normal',
  onMouseEnter,
  onMouseLeave,
  onClick
}: SpeechBubbleProps): React.ReactElement | null {
  if (phase === 'hidden' || !text) return null

  const isRemind = priority === 'high'
  const isFading = phase === 'fading'

  return (
    <button
      type="button"
      data-pet-hit
      aria-label={onClick ? '打开聊天' : undefined}
      className={[
        'electron-no-drag absolute left-1/2 top-0 z-10 min-w-[140px] max-w-[min(200px,calc(100vw-32px))] -translate-x-1/2 -translate-y-full cursor-pointer whitespace-normal break-words rounded-xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed shadow-bubble transition-opacity duration-500 ease-out',
        isFading ? 'pointer-events-none opacity-0' : 'opacity-100',
        isRemind
          ? 'border-l-[3px] border-petory-warning bg-petory-warning-soft text-petory-text'
          : 'bg-petory-surface text-petory-text'
      ].join(' ')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {text}
      <span
        className={[
          'absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transition-opacity duration-500 ease-out',
          isFading ? 'opacity-0' : 'opacity-100',
          isRemind ? 'bg-petory-warning-soft' : 'bg-petory-surface'
        ].join(' ')}
        aria-hidden
      />
    </button>
  )
}
