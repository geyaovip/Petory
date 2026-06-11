import { useEffect, useState, type ReactElement } from 'react'
import { ERRORS_COPY } from '@shared/copy/errors'
import { ChatPanel } from './chat/ChatPanel'
import { AppShell } from './components/AppShell'
import { PanelLoading } from './components/ui/PanelLoading'
import { PetOverlay } from './components/PetOverlay'
import { GrowthPanel } from './growth/GrowthPanel'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { AuthPanel } from './auth/AuthPanel'
import { GuidePanel } from './guide/GuidePanel'
import { PetManagerPanel } from './pets/PetManagerPanel'
import { PomodoroPanel } from './pomodoro/PomodoroPanel'
import { SettingsPanel } from './settings/SettingsPanel'

function PetApp({ petId }: { petId: string }): ReactElement {
  useEffect(() => {
    return window.petory.menu.onAction((action) => {
      switch (action) {
        case 'chat':
          window.petory.chat.open()
          break
        case 'focus':
          window.petory.pomodoro.open()
          break
        case 'settings':
          window.petory.settings.open()
          break
        case 'hide':
          window.petory.window.hide()
          break
        case 'quit':
          window.petory.app.quit()
          break
      }
    })
  }, [])

  return <PetOverlay petId={petId} />
}

export default function App(): ReactElement | null {
  const [mode, setMode] = useState<
    | 'loading'
    | 'auth'
    | 'onboarding'
    | 'pet'
    | 'chat'
    | 'pomodoro'
    | 'growth'
    | 'settings'
    | 'pets'
    | 'guide'
  >('loading')
  const [petId, setPetId] = useState<string | null>(null)

  useEffect(() => {
    if (!window.petory) {
      setMode('auth')
      return
    }
    void Promise.all([window.petory.app.getMode(), window.petory.app.getPetId()])
      .then(([nextMode, nextPetId]) => {
        setMode(nextMode)
        setPetId(nextPetId)
      })
      .catch(() => setMode('auth'))
  }, [])

  if (mode === 'loading') {
    return (
      <AppShell mode="loading">
        <PanelLoading />
      </AppShell>
    )
  }

  let content: ReactElement
  if (mode === 'auth') content = <AuthPanel />
  else if (mode === 'onboarding') content = <OnboardingFlow />
  else if (mode === 'chat') content = <ChatPanel />
  else if (mode === 'pomodoro') content = <PomodoroPanel />
  else if (mode === 'growth') content = <GrowthPanel />
  else if (mode === 'settings') content = <SettingsPanel />
  else if (mode === 'pets') content = <PetManagerPanel />
  else if (mode === 'guide') content = <GuidePanel />
  else if (mode === 'pet' && petId) content = <PetApp petId={petId} />
  else {
    content = (
      <div className="flex h-full items-center justify-center bg-petory-bg px-6 text-center text-[13px] text-petory-text-secondary">
        {ERRORS_COPY.petLoadFailed}
      </div>
    )
  }

  return (
    <AppShell mode={mode}>
      {content}
    </AppShell>
  )
}
