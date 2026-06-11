import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react'
import { ERRORS_COPY } from '@shared/copy/errors'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[petory] renderer error:', error, info.componentStack)
    window.petory?.crash?.reportRenderer(error.message, info.componentStack ?? undefined)
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-petory-bg px-6 text-center text-petory-text">
          <div className="mb-4 h-14 w-14 rounded-full bg-petory-error-soft opacity-80" aria-hidden />
          <h1 className="text-[18px] font-semibold">{ERRORS_COPY.boundary.title}</h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-petory-text-secondary">
            {ERRORS_COPY.boundary.message}
          </p>
          <Button className="mt-6" variant="secondary" onClick={() => window.location.reload()}>
            {ERRORS_COPY.boundary.reload}
          </Button>
        </div>
      )
    }

    return <>{this.props.children}</>
  }
}
