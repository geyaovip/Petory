import { PLAN_LIMITS } from '../../../src/shared/entitlements.js'
import { config as envConfig } from '../config.js'
import { prisma } from '../lib/prisma.js'

export interface SystemConfigValues {
  freeDailyGenerationLimit: number
  proDailyGenerationLimit: number
  freeDailyChatLimit: number
  proDailyChatLimit: number
  registrationOpen: boolean
  generationServiceEnabled: boolean
  chatServiceEnabled: boolean
  paymentEnabled: boolean
  mockPaymentEnabled: boolean
  maintenanceNotice: string
  jobTimeoutMs: number
}

const DEFAULTS: SystemConfigValues = {
  freeDailyGenerationLimit: PLAN_LIMITS.free.dailyGenerationLimit,
  proDailyGenerationLimit: PLAN_LIMITS.pro.dailyGenerationLimit,
  freeDailyChatLimit: PLAN_LIMITS.free.dailyChatLimit,
  proDailyChatLimit: PLAN_LIMITS.pro.dailyChatLimit,
  registrationOpen: true,
  generationServiceEnabled: true,
  chatServiceEnabled: true,
  paymentEnabled: true,
  mockPaymentEnabled: true,
  maintenanceNotice: '',
  jobTimeoutMs: envConfig.jobTimeoutMs
}

const KEY_MAP: Record<keyof SystemConfigValues, string> = {
  freeDailyGenerationLimit: 'free_daily_generation_limit',
  proDailyGenerationLimit: 'pro_daily_generation_limit',
  freeDailyChatLimit: 'free_daily_chat_limit',
  proDailyChatLimit: 'pro_daily_chat_limit',
  registrationOpen: 'registration_open',
  generationServiceEnabled: 'generation_service_enabled',
  chatServiceEnabled: 'chat_service_enabled',
  paymentEnabled: 'payment_enabled',
  mockPaymentEnabled: 'mock_payment_enabled',
  maintenanceNotice: 'maintenance_notice',
  jobTimeoutMs: 'job_timeout_ms'
}

let cache: { values: SystemConfigValues; expiresAt: number } | null = null
const CACHE_MS = 30_000

function parseValue(key: keyof SystemConfigValues, raw: string): SystemConfigValues[keyof SystemConfigValues] {
  const def = DEFAULTS[key]
  if (typeof def === 'boolean') return (raw === 'true') as SystemConfigValues[keyof SystemConfigValues]
  if (typeof def === 'number') return Number(raw) as SystemConfigValues[keyof SystemConfigValues]
  return raw as SystemConfigValues[keyof SystemConfigValues]
}

function serializeValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export async function getSystemConfig(): Promise<SystemConfigValues> {
  if (cache && Date.now() < cache.expiresAt) return cache.values

  const rows = await prisma.systemConfig.findMany()
  const values = { ...DEFAULTS }
  for (const row of rows) {
    const entry = Object.entries(KEY_MAP).find(([, dbKey]) => dbKey === row.key)
    if (!entry) continue
    const configKey = entry[0] as keyof SystemConfigValues
    values[configKey] = parseValue(configKey, row.value) as never
  }

  cache = { values, expiresAt: Date.now() + CACHE_MS }
  return values
}

export function invalidateSystemConfigCache(): void {
  cache = null
}

export async function getPlanGenerationLimit(plan: 'free' | 'pro'): Promise<number> {
  const cfg = await getSystemConfig()
  return plan === 'pro' ? cfg.proDailyGenerationLimit : cfg.freeDailyGenerationLimit
}

export async function getPlanChatLimit(plan: 'free' | 'pro'): Promise<number> {
  const cfg = await getSystemConfig()
  return plan === 'pro' ? cfg.proDailyChatLimit : cfg.freeDailyChatLimit
}

export async function updateSystemConfig(
  patch: Partial<SystemConfigValues>,
  adminId: string
): Promise<SystemConfigValues> {
  const entries = Object.entries(patch) as Array<[keyof SystemConfigValues, unknown]>
  for (const [key, value] of entries) {
    if (value === undefined) continue
    const dbKey = KEY_MAP[key]
    await prisma.systemConfig.upsert({
      where: { key: dbKey },
      create: { key: dbKey, value: serializeValue(value), updatedBy: adminId },
      update: { value: serializeValue(value), updatedBy: adminId }
    })
  }

  invalidateSystemConfigCache()
  const next = await getSystemConfig()
  await syncQuotaLimitsFromConfig(next)
  return next
}

export async function syncQuotaLimitsFromConfig(cfg: SystemConfigValues): Promise<void> {
  const users = await prisma.user.findMany({ include: { quota: true, chatQuota: true } })
  for (const user of users) {
    const genLimit =
      user.plan === 'pro' ? cfg.proDailyGenerationLimit : cfg.freeDailyGenerationLimit
    const chatLimit = user.plan === 'pro' ? cfg.proDailyChatLimit : cfg.freeDailyChatLimit
    if (user.quota) {
      await prisma.generationQuota.update({
        where: { userId: user.id },
        data: { dailyLimit: genLimit }
      })
    }
    if (user.chatQuota) {
      await prisma.chatQuota.update({
        where: { userId: user.id },
        data: { dailyLimit: chatLimit }
      })
    }
  }
}

export async function seedSystemConfigDefaults(): Promise<void> {
  const count = await prisma.systemConfig.count()
  if (count > 0) return
  for (const [key, dbKey] of Object.entries(KEY_MAP)) {
    const configKey = key as keyof SystemConfigValues
    await prisma.systemConfig.create({
      data: { key: dbKey, value: serializeValue(DEFAULTS[configKey]) }
    })
  }
}

export async function assertGenerationEnabled(): Promise<
  { ok: true } | { ok: false; code: string; message: string }
> {
  const cfg = await getSystemConfig()
  if (!cfg.generationServiceEnabled) {
    return { ok: false, code: 'SERVICE_DISABLED', message: '生成服务维护中，请稍后再试。' }
  }
  return { ok: true }
}

export async function assertChatEnabled(): Promise<
  { ok: true } | { ok: false; code: string; message: string }
> {
  const cfg = await getSystemConfig()
  if (!cfg.chatServiceEnabled) {
    return { ok: false, code: 'SERVICE_DISABLED', message: '对话服务维护中，请稍后再试。' }
  }
  return { ok: true }
}

export function getPublicAppStatus(cfg: SystemConfigValues) {
  return {
    registrationOpen: cfg.registrationOpen,
    generationServiceEnabled: cfg.generationServiceEnabled,
    chatServiceEnabled: cfg.chatServiceEnabled,
    paymentEnabled: cfg.paymentEnabled,
    mockPaymentEnabled: cfg.mockPaymentEnabled,
    maintenanceNotice: cfg.maintenanceNotice || null,
    limits: {
      free: {
        dailyGenerationLimit: cfg.freeDailyGenerationLimit,
        dailyChatLimit: cfg.freeDailyChatLimit
      },
      pro: {
        dailyGenerationLimit: cfg.proDailyGenerationLimit,
        dailyChatLimit: cfg.proDailyChatLimit
      }
    }
  }
}
