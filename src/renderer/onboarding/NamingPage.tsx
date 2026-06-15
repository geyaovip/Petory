import { useState, type ReactElement } from 'react'
import { PERSONALITIES } from '@shared/constants'
import { ONBOARDING_COPY } from '@shared/copy/onboarding'
import type { PetPersonality } from '@shared/types/pet'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageShell } from '../components/ui/PageShell'
import { Pill } from '../components/ui/Pill'

interface NamingPageProps {
  petId: string
  isSample?: boolean
  onSubmit: () => void
}

export function NamingPage({
  petId,
  isSample = false,
  onSubmit
}: NamingPageProps): ReactElement {
  const [name, setName] = useState(isSample ? '小橘子' : '')
  const [userCallName, setUserCallName] = useState('主人')
  const [personality, setPersonality] = useState<PetPersonality>('温柔陪伴型')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await window.petory.pet.finalize({
        petId,
        name: name.trim(),
        personality,
        userCallName: userCallName.trim() || '主人'
      })
      onSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <h1 className="text-[22px] font-semibold">{ONBOARDING_COPY.naming.title}</h1>
      <p className="mt-2 text-[13px] text-petory-text-secondary">
        {isSample ? ONBOARDING_COPY.naming.subtitleSample : ONBOARDING_COPY.naming.subtitleCustom}
      </p>

      <label className="mt-8 block text-[13px] font-medium text-petory-text-secondary">
        宠物名称
        <Input
          className="mt-2 bg-petory-surface"
          maxLength={20}
          placeholder="例如：奶盖"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <span className="mt-1 block text-right text-[11px] text-petory-text-tertiary">
          {name.length}/20
        </span>
      </label>

      <div className="mt-6">
        <p className="text-[13px] font-medium text-petory-text-secondary">宠物性格</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PERSONALITIES.map((item) => (
            <Pill
              key={item}
              className="px-3 py-1.5 text-[13px]"
              selected={personality === item}
              onClick={() => setPersonality(item)}
            >
              {item}
            </Pill>
          ))}
        </div>
      </div>

      <label className="mt-6 block text-[13px] font-medium text-petory-text-secondary">
        它怎么称呼你
        <Input
          className="mt-2 bg-petory-surface"
          maxLength={20}
          placeholder="主人"
          value={userCallName}
          onChange={(e) => setUserCallName(e.target.value)}
        />
      </label>

      <Button
        fullWidth
        className="mt-10"
        disabled={!name.trim() || submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? '创建中…' : '完成，住进桌面'}
      </Button>
    </PageShell>
  )
}
