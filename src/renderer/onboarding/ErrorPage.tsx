import type { ReactElement } from 'react'
import { ERROR_MESSAGES } from '@shared/constants'
import { Button } from '../components/ui/Button'
import { PageShell } from '../components/ui/PageShell'
import type { OnboardingErrorCode } from './types'

interface ErrorPageProps {
  code: OnboardingErrorCode
  message: string
  onTryAgain?: () => void
  onUploadAnother: () => void
}

function retryLabel(code: OnboardingErrorCode): string {
  if (code === 'style_locked') return '返回选风格'
  if (code === 'network_error' || code === 'rate_limit') return '重试'
  if (code === 'service_disabled') return '稍后再试'
  return '重试'
}

export function ErrorPage({
  code,
  message,
  onTryAgain,
  onUploadAnother
}: ErrorPageProps): ReactElement {
  const displayMessage =
    code === 'auth_expired' && !message.includes('登录') ? ERROR_MESSAGES.auth_expired : message
  const showTryAgain =
    code !== 'upload_invalid' && code !== 'auth_expired' && Boolean(onTryAgain)

  return (
    <PageShell className="items-center justify-center text-center">
      <div className="mb-6 rounded-2xl bg-petory-error-soft px-4 py-3 text-[14px] leading-relaxed text-petory-text">
        {displayMessage}
      </div>
      {code === 'auth_expired' ? (
        <p className="mb-4 text-[13px] text-petory-text-secondary">将自动打开登录窗口，请重新登录。</p>
      ) : null}
      <div className="flex w-full max-w-[320px] flex-col gap-3">
        {showTryAgain ? (
          <Button fullWidth onClick={onTryAgain}>
            {retryLabel(code)}
          </Button>
        ) : null}
        {code === 'style_locked' ? (
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              window.petory.settings.open()
            }}
          >
            去设置兑换 Pro
          </Button>
        ) : null}
        <Button fullWidth variant={showTryAgain ? 'secondary' : 'primary'} onClick={onUploadAnother}>
          上传另一张
        </Button>
      </div>
    </PageShell>
  )
}
