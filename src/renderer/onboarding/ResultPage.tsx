import { useEffect, useState, type ReactElement } from 'react'
import { ONBOARDING_COPY } from '@shared/copy/onboarding'
import { Button } from '../components/ui/Button'
import { PageShell } from '../components/ui/PageShell'

interface ResultPageProps {
  petId: string
  onUse: () => void
  onRegenerate: () => void
  onUploadAnother: () => void
}

export function ResultPage({
  petId,
  onUse,
  onRegenerate,
  onUploadAnother
}: ResultPageProps): ReactElement {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    void window.petory.pet.getPreviewImage(petId).then(setPreview)
  }, [petId])

  return (
    <PageShell className="items-center">
      <h1 className="w-full text-center text-[22px] font-semibold">{ONBOARDING_COPY.result.title}</h1>
      <p className="mt-2 text-center text-[13px] text-petory-text-secondary">
        {ONBOARDING_COPY.result.subtitle}
      </p>

      <div className="bg-petory-checker mt-8 flex h-[240px] w-full items-center justify-center rounded-2xl border border-petory-border">
        {preview ? (
          <img src={preview} alt="Generated pet" className="max-h-[200px] max-w-[80%] object-contain" />
        ) : (
          <div className="h-32 w-32 animate-pulse rounded-full bg-petory-primary-soft" />
        )}
      </div>

      <div className="mt-8 flex w-full flex-col items-center gap-3">
        <Button fullWidth onClick={onUse}>
          {ONBOARDING_COPY.result.useCta}
        </Button>

        <Button fullWidth variant="secondary" onClick={onRegenerate}>
          {ONBOARDING_COPY.result.regenerate}
        </Button>

        <Button fullWidth variant="ghost" onClick={onUploadAnother}>
          {ONBOARDING_COPY.result.uploadAnother}
        </Button>
      </div>
    </PageShell>
  )
}
