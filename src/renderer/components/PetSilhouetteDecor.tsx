import type { ReactElement } from 'react'

export function PetSilhouetteDecor(): ReactElement {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 120 100"
        className="absolute -left-6 top-16 h-24 w-28 opacity-[0.14] animate-pet-float"
      >
        <ellipse cx="60" cy="72" rx="34" ry="22" fill="currentColor" className="text-petory-primary" />
        <circle cx="60" cy="38" r="22" fill="currentColor" className="text-petory-primary" />
        <polygon
          points="38,32 28,18 42,26"
          fill="currentColor"
          className="text-petory-primary"
        />
        <polygon
          points="82,32 92,18 78,26"
          fill="currentColor"
          className="text-petory-primary"
        />
      </svg>

      <svg
        viewBox="0 0 100 80"
        className="absolute -right-4 top-32 h-20 w-24 opacity-[0.1] animate-pet-float"
        style={{ animationDelay: '0.8s' }}
      >
        <ellipse cx="50" cy="58" rx="28" ry="18" fill="currentColor" className="text-petory-accent" />
        <circle cx="50" cy="32" r="18" fill="currentColor" className="text-petory-accent" />
        <path
          d="M32 28 Q22 12 36 20"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-petory-accent"
        />
        <path
          d="M68 28 Q78 12 64 20"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-petory-accent"
        />
      </svg>

      <svg
        viewBox="0 0 80 60"
        className="absolute bottom-24 left-1/4 h-14 w-16 opacity-[0.08] animate-pet-float"
        style={{ animationDelay: '1.6s' }}
      >
        <ellipse cx="40" cy="44" rx="22" ry="14" fill="currentColor" className="text-petory-primary" />
        <circle cx="40" cy="24" r="14" fill="currentColor" className="text-petory-primary" />
      </svg>
    </div>
  )
}
