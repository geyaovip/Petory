import type { ReactElement } from 'react'
import type { GuideStepId } from '@shared/copy/guide'

interface GuideIllustrationProps {
  stepId: GuideStepId
}

export function GuideIllustration({ stepId }: GuideIllustrationProps): ReactElement {
  const common = 'h-28 w-full max-w-[240px]'

  switch (stepId) {
    case 'drag':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <rect x="20" y="52" width="200" height="48" rx="12" fill="#F5F2ED" />
          <circle cx="88" cy="68" r="18" fill="#FFE8E4" stroke="#FF8A7A" strokeWidth="2" />
          <path d="M76 68h24M88 56v24" stroke="#FF8A7A" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M140 44h28M154 30v28"
            stroke="#7EC8E3"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'bubble':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <rect x="52" y="16" width="136" height="44" rx="12" fill="#FFFFFF" stroke="#E8E6E1" />
          <text x="120" y="44" textAnchor="middle" fill="#6B6560" fontSize="12">
            聊点什么？
          </text>
          <polygon points="108,60 120,72 132,60" fill="#FFFFFF" stroke="#E8E6E1" />
          <circle cx="120" cy="88" r="16" fill="#FFE8E4" stroke="#FF8A7A" strokeWidth="2" />
        </svg>
      )
    case 'menu':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <rect x="72" y="20" width="96" height="72" rx="12" fill="#FFFFFF" stroke="#E8E6E1" />
          <rect x="84" y="34" width="72" height="10" rx="5" fill="#FFE8E4" />
          <rect x="84" y="50" width="72" height="10" rx="5" fill="#F5F2ED" />
          <rect x="84" y="66" width="72" height="10" rx="5" fill="#F5F2ED" />
          <circle cx="120" cy="96" r="12" fill="#FFE8E4" />
        </svg>
      )
    case 'identity':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <rect x="28" y="28" width="48" height="48" rx="10" fill="#FFE8E4" />
          <rect x="96" y="28" width="48" height="48" rx="10" fill="#E8F6FC" />
          <rect x="164" y="28" width="48" height="48" rx="10" fill="#FFF8E8" />
          <circle cx="52" cy="44" r="10" fill="#FF8A7A" opacity="0.6" />
          <rect x="110" y="40" width="20" height="20" rx="4" fill="#7EC8E3" />
          <path d="M180 52l8-8 8 8-8 8z" fill="#E8A838" />
        </svg>
      )
    case 'multiPet':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <circle cx="96" cy="64" r="22" fill="#FFE8E4" stroke="#FF8A7A" strokeWidth="2" />
          <circle cx="144" cy="64" r="18" fill="#E8F6FC" stroke="#7EC8E3" strokeWidth="2" />
          <text x="96" y="68" textAnchor="middle" fill="#FF8A7A" fontSize="10">
            主
          </text>
        </svg>
      )
    case 'poses':
      return (
        <svg viewBox="0 0 240 112" className={common} aria-hidden>
          <circle cx="60" cy="56" r="16" fill="#FFE8E4" />
          <circle cx="120" cy="56" r="16" fill="#E8F6FC" />
          <circle cx="180" cy="56" r="16" fill="#FFF8E8" />
          <path d="M48 80h144" stroke="#E8E6E1" strokeWidth="2" strokeLinecap="round" />
          <text x="60" y="60" textAnchor="middle" fill="#6B6560" fontSize="9">
            坐
          </text>
          <text x="120" y="60" textAnchor="middle" fill="#6B6560" fontSize="9">
            专注
          </text>
          <text x="180" y="60" textAnchor="middle" fill="#6B6560" fontSize="9">
            睡
          </text>
        </svg>
      )
    default:
      return <div className={`${common} rounded-2xl bg-petory-primary-soft`} />
  }
}
