import { CUSTOM_PET_LIMIT_MESSAGE, PLAN_LIMITS } from '../../../src/shared/entitlements'
import type { AuthState, EntitlementLimits } from '../../../src/shared/types/auth'
import {
  getMaintenanceNotice,
  isChatServiceEnabled,
  isGenerationServiceEnabled,
  isMockPaymentEnabled,
  isPaymentEnabled,
  isRegistrationOpen
} from '../api/appStatus'
import { isRemoteBackendEnabled } from '../api/config'
import {
  getEffectiveLimits,
  getRemoteLimits,
  getRemoteRemainingChat,
  getRemoteRemainingGeneration,
  getRemoteUsageSnapshot,
  isUsingRemoteQuota,
  isRemoteCustomPetCreated
} from '../api/remoteQuotaStore'
import { loadStore } from '../petStore'
import { hasUploadReference } from '../image/referencePath'
import { getCurrentUser, loadSession } from './authStore'
import { loadUsage } from './usageStore'

function ownedPetCount(): number {
  return loadStore().pets.filter((pet) => pet.status !== 'draft').length
}

function localCustomPetCount(): number {
  return loadStore().pets.filter((pet) => !pet.isSample).length
}

function hasCustomPetSlotUsed(): boolean {
  if (isUsingRemoteQuota() && isRemoteCustomPetCreated()) return true
  return localCustomPetCount() > 0
}

function isContinuingCustomDraft(petId?: string): boolean {
  if (!petId) return false
  const pet = loadStore().pets.find((p) => p.id === petId)
  return Boolean(pet && !pet.isSample && !pet.imagePetPath && hasUploadReference(pet))
}

export function getLimitsForUser(): EntitlementLimits {
  const user = getCurrentUser()
  const plan = user?.plan ?? 'free'
  return PLAN_LIMITS[plan]
}

function remoteStatusFields(): Pick<
  AuthState,
  | 'useRemoteBackend'
  | 'maintenanceNotice'
  | 'registrationOpen'
  | 'generationServiceEnabled'
  | 'chatServiceEnabled'
  | 'paymentEnabled'
  | 'mockPaymentEnabled'
> {
  if (!isRemoteBackendEnabled()) {
    return { useRemoteBackend: false, maintenanceNotice: null }
  }
  return {
    useRemoteBackend: true,
    maintenanceNotice: getMaintenanceNotice(),
    registrationOpen: isRegistrationOpen(),
    generationServiceEnabled: isGenerationServiceEnabled(),
    chatServiceEnabled: isChatServiceEnabled(),
    paymentEnabled: isPaymentEnabled(),
    mockPaymentEnabled: isMockPaymentEnabled()
  }
}

export function buildAuthState(): AuthState {
  const session = loadSession()
  const remoteStatus = remoteStatusFields()

  if (isUsingRemoteQuota()) {
    const plan = getCurrentUser()?.plan ?? 'free'
    const limits = getRemoteLimits() ?? getEffectiveLimits(plan)
    const remoteUsage = getRemoteUsageSnapshot()
    const remoteGen = getRemoteRemainingGeneration()
    const remoteChat = getRemoteRemainingChat()
    const usage = remoteUsage ?? { date: new Date().toISOString().slice(0, 10), chatCount: 0, generationCount: 0 }
    return {
      session,
      usage,
      limits,
      remainingChat:
        remoteChat ?? Math.max(0, limits.dailyChatLimit - usage.chatCount),
      remainingGeneration:
        remoteGen ?? Math.max(0, limits.dailyGenerationLimit - usage.generationCount),
      canCreateCustomPet: !hasCustomPetSlotUsed(),
      ...remoteStatus
    }
  }

  const limits = getLimitsForUser()
  const usage = loadUsage()
  return {
    session,
    usage,
    limits,
    remainingChat: Math.max(0, limits.dailyChatLimit - usage.chatCount),
    remainingGeneration: Math.max(0, limits.dailyGenerationLimit - usage.generationCount),
    canCreateCustomPet: !hasCustomPetSlotUsed(),
    ...remoteStatus
  }
}

export function canSendChat(): { ok: true } | { ok: false; message: string } {
  if (isRemoteBackendEnabled() && isUsingRemoteQuota() && !isChatServiceEnabled()) {
    return { ok: false, message: '对话服务维护中，请稍后再试。' }
  }
  const { remainingChat } = buildAuthState()
  if (remainingChat <= 0) {
    return {
      ok: false,
      message: '今日对话次数已用完，请明天再来。'
    }
  }
  return { ok: true }
}

export function canGeneratePet(
  petId?: string
): { ok: true } | { ok: false; message: string } {
  if (isRemoteBackendEnabled() && isUsingRemoteQuota() && !isGenerationServiceEnabled()) {
    return { ok: false, message: '生成服务维护中，请稍后再试。' }
  }
  const { remainingGeneration } = buildAuthState()
  if (remainingGeneration <= 0) {
    return {
      ok: false,
      message: '今日生成次数已用完，请明天再来。'
    }
  }
  if (hasCustomPetSlotUsed() && !isContinuingCustomDraft(petId)) {
    return { ok: false, message: CUSTOM_PET_LIMIT_MESSAGE }
  }
  return { ok: true }
}

export function canRegenerateCustomPet(
  petId: string
): { ok: true } | { ok: false; message: string } {
  const pet = loadStore().pets.find((p) => p.id === petId)
  if (!pet || pet.isSample) {
    return { ok: false, message: '示例宠物不支持重新生成。' }
  }
  if (hasCustomPetSlotUsed() || pet.imagePetPath) {
    return { ok: false, message: CUSTOM_PET_LIMIT_MESSAGE }
  }
  return { ok: true }
}

export function canShowPetOnDesktop(
  petId: string
): { ok: true } | { ok: false; message: string } {
  const limits = getLimitsForUser()
  const target = loadStore().pets.find((p) => p.id === petId)
  if (!target?.imagePetPath) {
    return { ok: false, message: '该宠物尚未准备好。' }
  }
  if (target.onDesktop) {
    return { ok: true }
  }

  const visibleCount = loadStore().pets.filter((p) => p.onDesktop && p.imagePetPath).length
  if (visibleCount >= limits.maxDesktopPets) {
    return {
      ok: false,
      message: `最多同时显示 ${limits.maxDesktopPets} 只桌宠，请先从桌面隐藏一只。`
    }
  }
  return { ok: true }
}

export function canActivatePet(petId: string): { ok: true } | { ok: false; message: string } {
  const target = loadStore().pets.find((p) => p.id === petId)
  if (!target?.imagePetPath) {
    return { ok: false, message: '该宠物尚未准备好。' }
  }

  return { ok: true }
}

export function canCreatePet(): { ok: true } | { ok: false; message: string } {
  if (hasCustomPetSlotUsed()) {
    return { ok: false, message: CUSTOM_PET_LIMIT_MESSAGE }
  }

  const limits = getLimitsForUser()

  if (ownedPetCount() >= limits.maxPets) {
    return {
      ok: false,
      message: `已达到 ${limits.maxPets} 只宠物的本地管理上限。`
    }
  }
  return { ok: true }
}
