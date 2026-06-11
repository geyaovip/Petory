import type { EntitlementLimits, UsageSnapshot } from '../../../src/shared/types/auth'
import type { ServerQuotaView } from '../../../src/shared/types/api'
import { PLAN_LIMITS } from '../../../src/shared/entitlements'
import type { PlanTier } from '../../../src/shared/types/auth'
import { getCurrentUser, loadSession, saveSession } from '../auth/authStore'
import { apiFetch } from './client'
import { getCachedAppStatus } from './appStatus'
import { isRemoteBackendEnabled } from './config'

interface RemoteQuotaCache {
  generation: ServerQuotaView | null
  chat: ServerQuotaView | null
  limits: EntitlementLimits | null
}

const cache: RemoteQuotaCache = {
  generation: null,
  chat: null,
  limits: null
}

let lastRefreshAt = 0
const REFRESH_TTL_MS = 15_000

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getEffectiveLimits(plan: PlanTier): EntitlementLimits {
  if (cache.limits) return cache.limits
  const app = getCachedAppStatus()
  const base = PLAN_LIMITS[plan]
  if (!app) return base
  const dynamic = app.limits[plan]
  return {
    ...base,
    dailyGenerationLimit: dynamic.dailyGenerationLimit,
    dailyChatLimit: dynamic.dailyChatLimit
  }
}

export function isUsingRemoteQuota(): boolean {
  if (!isRemoteBackendEnabled()) return false
  const user = getCurrentUser()
  return Boolean(user && user.id !== 'offline-guest')
}

export function getRemoteLimits(): EntitlementLimits | null {
  if (!isUsingRemoteQuota()) return null
  const plan = getCurrentUser()?.plan ?? 'free'
  return getEffectiveLimits(plan)
}

export function getRemoteUsageSnapshot(): UsageSnapshot | null {
  if (!isUsingRemoteQuota() || !cache.generation || !cache.chat) return null
  return {
    date: todayKey(),
    generationCount: cache.generation.usedToday,
    chatCount: cache.chat.usedToday
  }
}

export function getRemoteRemainingGeneration(): number | null {
  return cache.generation?.remainingToday ?? null
}

export function getRemoteRemainingChat(): number | null {
  return cache.chat?.remainingToday ?? null
}

export function applyQuotaFromResponse(input: {
  quota?: ServerQuotaView
  chatQuota?: ServerQuotaView
  userLimits?: EntitlementLimits
}): void {
  if (input.quota) cache.generation = input.quota
  if (input.chatQuota) cache.chat = input.chatQuota
  if (input.userLimits) cache.limits = input.userLimits
}

export async function ensureRemoteQuotaFresh(force = false): Promise<void> {
  if (!isUsingRemoteQuota()) return
  if (!force && Date.now() - lastRefreshAt < REFRESH_TTL_MS) return
  await refreshRemoteQuota()
}

export async function refreshRemoteQuota(): Promise<void> {
  if (!isUsingRemoteQuota()) return

  const me = await apiFetch<{
    user: {
      id: string
      email: string
      displayName: string
      plan: PlanTier
      proExpiresAt?: string | null
      createdAt: string
      limits: EntitlementLimits
    }
    quota: ServerQuotaView
    chatQuota: ServerQuotaView
  }>('/api/me')

  cache.limits = me.user.limits
  cache.generation = me.quota
  cache.chat = me.chatQuota
  lastRefreshAt = Date.now()

  const session = loadSession()
  if (session?.user.id === me.user.id) {
    saveSession({
      ...session,
      user: {
        ...session.user,
        plan: me.user.plan,
        proExpiresAt: me.user.proExpiresAt ?? null
      }
    })
  }
}

export function clearRemoteQuota(): void {
  cache.generation = null
  cache.chat = null
  cache.limits = null
  lastRefreshAt = 0
}
