import { useCallback, useEffect, useState, type ReactElement } from 'react'
import type { OnboardingIntent } from '@shared/types/onboarding'
import { ErrorPage } from './ErrorPage'
import { GeneratingPage } from './GeneratingPage'
import { NamingPage } from './NamingPage'
import { ResultPage } from './ResultPage'
import { UploadPage } from './UploadPage'
import { WelcomePage } from './WelcomePage'
import type { OnboardingErrorCode, OnboardingStep } from './types'

type FlowStep = OnboardingStep | 'loading'

export function OnboardingFlow(): ReactElement {
  const [step, setStep] = useState<FlowStep>('loading')
  const [replaceMode, setReplaceMode] = useState(false)
  const [returnToPets, setReturnToPets] = useState(false)
  const [petId, setPetId] = useState<string | null>(null)
  const [isSamplePet, setIsSamplePet] = useState(false)
  const [errorCode, setErrorCode] =
    useState<OnboardingErrorCode>('generation_failed')
  const [errorMessage, setErrorMessage] = useState('')
  const [installingSample, setInstallingSample] = useState(false)

  const applyIntent = useCallback(
    async (intent: OnboardingIntent | null): Promise<void> => {
      const hasActive = await window.petory.pet.hasActive()
      setReturnToPets(intent?.returnTo === 'pets')

      if (intent?.mode === 'finalize') {
        const pets = await window.petory.pets.list()
        const pet = pets.find((item) => item.id === intent.petId)
        setReturnToPets(intent.returnTo === 'pets')
        if (!pet?.imagePetPath) {
          setReplaceMode(hasActive)
          setStep(hasActive ? 'upload' : 'welcome')
          return
        }
        setReplaceMode(false)
        setPetId(pet.id)
        setIsSamplePet(false)
        setStep('result')
        return
      }

      if (intent?.mode === 'restyle') {
        const pets = await window.petory.pets.list()
        const pet = pets.find((item) => item.id === intent.petId)
        if (!pet || pet.isSample) {
          setReplaceMode(hasActive)
          setStep(hasActive ? 'upload' : 'welcome')
          return
        }

        setReplaceMode(true)
        setPetId(pet.id)
        setIsSamplePet(false)
        setStep(pet.imagePetPath ? 'result' : 'upload')
        return
      }

      if (intent?.mode === 'new') {
        setReplaceMode(false)
        setPetId(null)
        setIsSamplePet(false)
        setStep('upload')
        return
      }

      if (intent?.mode === 'replace' || hasActive) {
        setReplaceMode(true)
        setPetId(null)
        setIsSamplePet(false)
        setStep('upload')
        return
      }

      setReplaceMode(false)
      setStep('welcome')
    },
    []
  )

  const returnToPrevious = useCallback((): void => {
    if (returnToPets) window.petory.pets.open()
    window.close()
  }, [returnToPets])

  useEffect(() => {
    void window.petory.pet.consumeOnboardingIntent().then((intent) => {
      void applyIntent(intent)
    })
    return window.petory.pet.onOnboardingIntent((intent) => {
      void applyIntent(intent)
    })
  }, [applyIntent])

  const runGeneration = useCallback(async (id: string) => {
    setIsSamplePet(false)
    setStep('generating')
    const result = await window.petory.pet.generate(id)
    if (!result.success) {
      setPetId(id)
      setErrorCode(result.code)
      setErrorMessage(result.message)
      setStep('error')
      return
    }
    setPetId(id)
    setStep('result')
  }, [])

  const runSample = useCallback(async () => {
    setInstallingSample(true)
    setStep('generating')
    try {
      const result = await window.petory.pet.installSample()
      if (!result.success) {
        setErrorCode('generation_failed')
        setErrorMessage(result.message)
        setStep('error')
        return
      }
      setPetId(result.petId)
      setIsSamplePet(true)
      setStep('naming')
    } finally {
      setInstallingSample(false)
    }
  }, [])

  if (step === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-petory-bg text-petory-text-secondary">
        加载中…
      </div>
    )
  }

  if (step === 'welcome') {
    return (
      <WelcomePage
        sampleLoading={installingSample}
        onCreate={() => setStep('upload')}
        onTrySample={() => void runSample()}
      />
    )
  }

  if (step === 'upload') {
    return (
      <UploadPage
        replaceMode={replaceMode}
        onUploaded={(id) => {
          setPetId(id)
          void runGeneration(id)
        }}
        onError={(message) => {
          setErrorCode('upload_invalid')
          setErrorMessage(message)
          setStep('error')
        }}
      />
    )
  }

  if (step === 'generating') {
    return <GeneratingPage />
  }

  if (step === 'result' && petId) {
    return (
      <ResultPage
        petId={petId}
        onUse={() => setStep('naming')}
        onRegenerate={() => void runGeneration(petId)}
        onUploadAnother={() => {
          setPetId(null)
          setIsSamplePet(false)
          setStep('upload')
        }}
      />
    )
  }

  if (step === 'naming' && petId) {
    return (
      <NamingPage
        petId={petId}
        isSample={isSamplePet}
        onSubmit={returnToPrevious}
      />
    )
  }

  if (step === 'error') {
    return (
      <ErrorPage
        code={errorCode}
        message={errorMessage}
        onTryAgain={
          petId
            ? () => void runGeneration(petId)
            : undefined
        }
        onUploadAnother={() => {
          setPetId(null)
          setIsSamplePet(false)
          setStep('upload')
        }}
      />
    )
  }

  return (
    <WelcomePage
      sampleLoading={installingSample}
      onCreate={() => setStep('upload')}
      onTrySample={() => void runSample()}
    />
  )
}
