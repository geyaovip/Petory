import type { ButtonHTMLAttributes, ReactElement } from 'react'

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function LinkButton({
  className = '',
  children,
  ...props
}: LinkButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={[
        'inline text-petory-primary underline-offset-2 transition-colors hover:text-petory-primary-hover hover:underline',
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
