import { PLAN_LIMITS } from '../../../src/shared/entitlements'
import { getStyleDefinition } from '../../../src/shared/styles'
import type { AuthState, EntitlementLimits } from '../../../src/shared/types/auth'
import type { PetStyleType } from '../../../src/shared/types/pet'
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
  isUsingRemoteQuota
} from '../api/remoteQuotaStore'
import { loadStore } from '../petStore'
import { getCurrentUser, loadSession } from './authStore'
import { loadUsage } from './usageStore'

function ownedPetCount(): number {
  return loadStore().pets.filter((pet) => pet.status !== 'draft').length
}

function hasActivePet(): boolean {
  return loadStore().pets.some((pet) => pet.status === 'active' && pet.isActive)
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
      message: '今日免费对话次数已用完，明天再来或升级 Pro。'
    }
  }
  return { ok: true }
}

export function canGeneratePet(): { ok: true } | { ok: false; message: string } {
  if (isRemoteBackendEnabled() && isUsingRemoteQuota() && !isGenerationServiceEnabled()) {
    return { ok: false, message: '生成服务维护中，请稍后再试。' }
  }
  const { remainingGeneration } = buildAuthState()
  if (remainingGeneration <= 0) {
    return {
      ok: false,
      message: '今日生成次数已用完，明天再来或升级 Pro。'
    }
  }
  return { ok: true }
}

export function canUseStyle(styleType: PetStyleType): { ok: true } | { ok: false; message: string } {
  const style = getStyleDefinition(styleType)
  const plan = getCurrentUser()?.plan ?? 'free'
  if (style.proOnly && plan !== 'pro') {
    return {
      ok: false,
      message: `「${style.labelZh}」为 Pro 专属风格，请在设置中兑换 Pro 后使用。`
    }
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
      message: limits.multiPet
        ? `最多同时显示 ${limits.maxDesktopPets} 只桌宠，请先从桌面隐藏一只。`
        : '免费版仅支持 1 只桌宠同时显示，升级 Pro 可多宠并行。'
    }
  }
  return { ok: true }
}

export function canActivatePet(petId: string): { ok: true } | { ok: false; message: string } {
  const limits = getLimitsForUser()
  const target = loadStore().pets.find((p) => p.id === petId)
  if (!target?.imagePetPath) {
    return { ok: false, message: '该宠物尚未准备好。' }
  }

  const otherReady = loadStore().pets.filter(
    (p) =>
      p.id !== petId &&
      p.imagePetPath &&
      (p.status === 'active' || p.status === 'generated')
  )
  if (!limits.multiPet && otherReady.length > 1) {
    return {
      ok: false,
      message: '免费版仅支持在少量宠物间切换。升级 Pro 可管理更多桌宠。'
    }
  }
  return { ok: true }
}

export function canCreatePet(): { ok: true } | { ok: false; message: string } {
  const limits = getLimitsForUser()

  if (!limits.multiPet && hasActivePet()) {
    return { ok: true }
  }

  if (ownedPetCount() >= limits.maxPets) {
    return {
      ok: false,
      message: limits.multiPet
        ? '已达到宠物数量上限。'
        : '免费版仅支持 1 只宠物，升级 Pro 可创建更多。'
    }
  }
  return { ok: true }
}
