import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { PETS_COPY } from '@shared/copy/pets'
import { PERSONALITIES } from '@shared/constants'
import { getStyleDefinition } from '@shared/styles'
import { PET_POSE_LABELS, PET_POSE_ORDER } from '@shared/poses'
import type { DesktopPetStatus, Pet, PetPersonality, PetPoseType } from '@shared/types/pet'
import { Button } from '../components/ui/Button'
import { PanelHeader } from '../components/ui/PanelHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { PanelLoading } from '../components/ui/PanelLoading'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StatusBanner } from '../components/ui/StatusBanner'
import { Pill } from '../components/ui/Pill'

export function PetManagerPanel(): ReactElement {
  const [pets, setPets] = useState<Pet[]>([])
  const [desktopStatus, setDesktopStatus] = useState<DesktopPetStatus | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [missingPoseCount, setMissingPoseCount] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [statusError, setStatusError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ petId: string; name: string } | null>(null)

  const load = useCallback(async () => {
    const [list, nextDesktopStatus, poseStatus] = await Promise.all([
      window.petory.pets.list(),
      window.petory.desktop.getStatus(),
      window.petory.pet.getPoseCompletionStatus()
    ])
    setPets(list)
    setDesktopStatus(nextDesktopStatus)
    setMissingPoseCount(
      Object.fromEntries(poseStatus.pending.map((item) => [item.petId, item.missing.length]))
    )

    const nextPreviews: Record<string, string> = {}
    await Promise.all(
      list.map(async (pet) => {
        const image = await window.petory.pet.getPreviewImage(pet.id)
        if (image) nextPreviews[pet.id] = image
      })
    )
    setPreviews(nextPreviews)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return window.petory.pets.onListChanged(() => {
      void load()
    })
  }, [load])

  const showStatus = (message: string, isError = false): void => {
    setStatus(message)
    setStatusError(isError)
    setTimeout(() => {
      setStatus(null)
      setStatusError(false)
    }, 3000)
  }

  const updatePersonality = async (petId: string, personality: PetPersonality): Promise<void> => {
    await window.petory.pets.updatePersonality(personality, petId)
    await load()
    showStatus('性格已更新')
  }

  const activatePet = async (petId: string): Promise<void> => {
    const result = await window.petory.pets.activate(petId)
    if (result.success) {
      await load()
      showStatus('已切换为当前桌宠')
    } else {
      showStatus(result.message, true)
    }
  }

  const deleteImages = async (petId: string): Promise<void> => {
    const result = await window.petory.data.deletePetImages(petId)
    if (result.success) {
      await load()
      showStatus('图片已删除')
    } else {
      showStatus(result.message, true)
    }
  }

  const canRestyle = (pet: Pet): boolean => !pet.isSample && Boolean(pet.imageOriginalPath)

  const existingPoses = (pet: Pet): PetPoseType[] =>
    PET_POSE_ORDER.filter((pose) => Boolean(pet.posePaths?.[pose]))

  const regeneratePose = async (petId: string, pose: PetPoseType): Promise<void> => {
    const key = `${petId}:${pose}`
    setRegeneratingKey(key)
    try {
      const result = await window.petory.pet.regeneratePose(petId, pose)
      if (result.success) {
        showStatus(`已重生成「${PET_POSE_LABELS[pose]}」`)
        await load()
      } else {
        showStatus(result.message, true)
      }
    } finally {
      setRegeneratingKey(null)
    }
  }

  const toggleDesktop = async (pet: Pet): Promise<void> => {
    if (pet.onDesktop) {
      await window.petory.desktop.hide(pet.id)
      await load()
      showStatus('已从桌面隐藏')
      return
    }
    const result = await window.petory.desktop.show(pet.id)
    if (result.success) {
      await load()
      showStatus('已显示在桌面')
    } else {
      showStatus(result.message, true)
    }
  }

  if (loading) {
    return <PanelLoading label={PETS_COPY.loading} />
  }

  return (
    <div className="flex h-full flex-col bg-petory-bg px-4 py-8 text-petory-text">
      <PanelHeader
        title="宠物管理"
        subtitle={
          desktopStatus
            ? `桌面显示 ${desktopStatus.visibleCount}/${desktopStatus.maxDesktopPets} · 主宠负责聊天与成长`
            : undefined
        }
        onClose={() => window.petory.pets.close()}
      />

      {status ? (
        <StatusBanner
          className="mt-3"
          message={status}
          variant={statusError ? 'error' : 'success'}
        />
      ) : null}

      {pets.length === 0 ? (
        <EmptyState
          title={PETS_COPY.empty.title}
          description={PETS_COPY.empty.description}
          actionLabel={PETS_COPY.empty.action}
          onAction={() => window.petory.pet.openOnboarding({ mode: 'new' })}
        />
      ) : (
        <ul className="mt-4 space-y-3 overflow-y-auto">
          {pets.map((pet) => (
            <li key={pet.id} className="rounded-2xl bg-petory-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-petory-checker-sm flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-petory-border">
                  {previews[pet.id] ? (
                    <img
                      src={previews[pet.id]}
                      alt={pet.name || '宠物预览'}
                      className="max-h-12 max-w-12 object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-petory-text-tertiary">无图</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{pet.name || '未命名'}</p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {pet.onDesktop ? (
                        <span className="rounded-full bg-[#E8F6FC] px-2 py-0.5 text-[11px] text-[#3A8FB5]">
                          桌面中
                        </span>
                      ) : null}
                      {pet.isActive ? (
                        <span className="rounded-full bg-petory-primary-soft px-2 py-0.5 text-[11px] text-petory-primary">
                          主宠
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[12px] text-petory-text-tertiary">
                    Lv.{pet.level} · {getStyleDefinition(pet.styleType).labelZh} ·{' '}
                    {Object.keys(pet.posePaths ?? {}).length || (pet.imagePetPath ? 1 : 0)} 种姿势 ·{' '}
                    {pet.personality}
                    {pet.isSample ? ' · 示例' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PERSONALITIES.map((item) => (
                  <Pill
                    key={item}
                    className="px-2 py-0.5 text-[11px]"
                    selected={pet.personality === item}
                    onClick={() => void updatePersonality(pet.id, item)}
                  >
                    {item}
                  </Pill>
                ))}
              </div>
              <Button
                className="mt-3"
                variant="secondary"
                fullWidth
                onClick={() => void toggleDesktop(pet)}
              >
                {pet.onDesktop ? '从桌面隐藏' : '显示在桌面'}
              </Button>
              {!pet.isActive ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  fullWidth
                  onClick={() => void activatePet(pet.id)}
                >
                  设为主宠（聊天/成长）
                </Button>
              ) : null}
              {missingPoseCount[pet.id] ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    void window.petory.pet.completePoses(pet.id).then(async (result) => {
                      if (result.success && 'addedPoses' in result && result.addedPoses.length > 0) {
                        showStatus(`已补全 ${result.addedPoses.length} 种姿势`)
                        await load()
                      } else if (!result.success) {
                        showStatus(result.message)
                      } else {
                        showStatus('姿势已是最新')
                        await load()
                      }
                    })
                  }
                >
                  补全 Pro 姿势（缺 {missingPoseCount[pet.id]} 种）
                </Button>
              ) : null}
              {existingPoses(pet).length > 0 && !pet.isSample ? (
                <div className="mt-3">
                  <p className="text-[11px] text-petory-text-tertiary">单姿势重生成（不扣额度）</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {existingPoses(pet).map((pose) => {
                      const key = `${pet.id}:${pose}`
                      const busy = regeneratingKey === key
                      return (
                        <Pill
                          key={pose}
                          className="px-2 py-0.5 text-[10px]"
                          disabled={Boolean(regeneratingKey)}
                          selected={busy}
                          onClick={() => void regeneratePose(pet.id, pose)}
                        >
                          {busy ? '生成中…' : PET_POSE_LABELS[pose]}
                        </Pill>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              {canRestyle(pet) ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    window.petory.pet.openOnboarding({ mode: 'restyle', petId: pet.id })
                  }
                >
                  换风格重新生成
                </Button>
              ) : null}
              <Button
                className="mt-3"
                variant="ghost"
                fullWidth
                onClick={() => setDeleteTarget({ petId: pet.id, name: pet.name })}
              >
                删除图片文件
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        className="mt-4"
        variant="secondary"
        fullWidth
        onClick={() => window.petory.pet.openOnboarding({ mode: 'new' })}
      >
        新建桌宠
      </Button>
      <Button className="mt-3" variant="ghost" fullWidth onClick={() => void load()}>
        刷新
      </Button>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={PETS_COPY.confirmDeleteImages.title}
        message={
          deleteTarget ? PETS_COPY.confirmDeleteImages.message(deleteTarget.name) : ''
        }
        confirmLabel={PETS_COPY.confirmDeleteImages.confirm}
        danger
        onConfirm={() => {
          if (deleteTarget) void deleteImages(deleteTarget.petId)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
