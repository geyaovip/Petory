import { useEffect, useState, type ReactElement } from 'react'
import { ONBOARDING_COPY } from '@shared/copy/onboarding'
import { getStyleDefinition } from '@shared/styles'
import type { PetStyleType } from '@shared/types/pet'
import { Button } from '../components/ui/Button'
import { StylePicker } from '../components/StylePicker'
import { PageShell } from '../components/ui/PageShell'
import { TextButton } from '../components/ui/TextButton'

interface StyleSelectPageProps {
  initialStyle: PetStyleType
  lastUsedStyle?: PetStyleType
  replaceMode?: boolean
  onBack: () => void
  onContinue: (style: PetStyleType) => void
}

export function StyleSelectPage({
  initialStyle,
  lastUsedStyle,
  replaceMode = false,
  onBack,
  onContinue
}: StyleSelectPageProps): ReactElement {
  const [style, setStyle] = useState<PetStyleType>(initialStyle)

  useEffect(() => {
    setStyle(initialStyle)
  }, [initialStyle])

  const lastUsedLabel = lastUsedStyle ? getStyleDefinition(lastUsedStyle).labelZh : null

  return (
    <PageShell>
      <TextButton className="mb-6 self-start px-0" onClick={onBack}>
        ← 返回
      </TextButton>
      <h1 className="text-[22px] font-semibold">{ONBOARDING_COPY.styleSelect.title}</h1>
      <p className="mt-2 text-[13px] text-petory-text-secondary">
        {replaceMode ? ONBOARDING_COPY.styleSelect.hintReplace : ONBOARDING_COPY.styleSelect.hint}
      </p>
      {lastUsedLabel ? (
        <p className="mt-1 text-[12px] text-petory-text-tertiary">上次使用：{lastUsedLabel}</p>
      ) : null}

      <div className="mt-6">
        <StylePicker value={style} onChange={setStyle} lastUsedStyle={lastUsedStyle} />
      </div>

      <Button className="mt-8" fullWidth onClick={() => onContinue(style)}>
        开始生成
      </Button>
    </PageShell>
  )
}
