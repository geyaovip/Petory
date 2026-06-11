import { useState, type ReactElement } from 'react'
import { GUIDE_COPY } from '@shared/copy/guide'
import { Button } from '../components/ui/Button'
import { TextButton } from '../components/ui/TextButton'
import { GuideIllustration } from './GuideIllustration'

export function GuidePanel(): ReactElement {
  const [step, setStep] = useState(0)
  const steps = GUIDE_COPY.steps
  const current = steps[step]
  const isLast = step === steps.length - 1

  const finish = async (): Promise<void> => {
    await window.petory.guide.complete()
    window.petory.guide.close()
  }

  return (
    <div className="flex h-full flex-col bg-petory-bg px-6 py-8 text-petory-text">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wide text-petory-primary">
          {GUIDE_COPY.stepLabel(step + 1, steps.length)}
        </p>
        <TextButton onClick={() => void finish()}>{GUIDE_COPY.skip}</TextButton>
      </div>

      <div className="mt-6 flex flex-1 flex-col items-center">
        <GuideIllustration stepId={current.id} />
        <h1 className="mt-6 w-full text-[22px] font-semibold">{current.title}</h1>
        <p className="mt-3 w-full text-[14px] leading-relaxed text-petory-text-secondary">{current.body}</p>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {steps.map((_, index) => (
          <span
            key={index}
            className={[
              'h-1.5 w-6 rounded-full',
              index === step ? 'bg-petory-primary' : 'bg-petory-border'
            ].join(' ')}
          />
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <Button variant="secondary" fullWidth onClick={() => setStep((s) => s - 1)}>
            {GUIDE_COPY.prev}
          </Button>
        ) : null}
        {isLast ? (
          <Button fullWidth onClick={() => void finish()}>
            {GUIDE_COPY.finish}
          </Button>
        ) : (
          <Button fullWidth onClick={() => setStep((s) => s + 1)}>
            {GUIDE_COPY.next}
          </Button>
        )}
      </div>
    </div>
  )
}
