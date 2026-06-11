import type { ButtonHTMLAttributes, ReactElement } from 'react'

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function TextButton({
  className = '',
  children,
  ...props
}: TextButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={[
        'rounded-lg px-2 py-1 text-[13px] font-medium text-petory-text-secondary transition-colors',
        'hover:bg-petory-primary-soft hover:text-petory-text',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
