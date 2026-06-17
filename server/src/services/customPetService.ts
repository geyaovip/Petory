import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

const CUSTOM_PET_LIMIT_MESSAGE = '每个账号仅可创建一只自定义宠物，无法再次生成。'

const CREATION_BATCH_TYPES = ['full_batch', 'client_local'] as const

export async function syncCustomPetCreatedAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { customPetCreatedAt: true }
  })
  if (!user) return null
  if (user.customPetCreatedAt) return user.customPetCreatedAt

  const earliest = await prisma.generationBatch.findFirst({
    where: { userId, jobType: { in: [...CREATION_BATCH_TYPES] } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true }
  })
  if (!earliest) return null

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { customPetCreatedAt: earliest.createdAt }
  })
  return updated.customPetCreatedAt
}

export async function hasUsedCustomPetSlot(userId: string): Promise<boolean> {
  const createdAt = await syncCustomPetCreatedAt(userId)
  return createdAt !== null
}

export async function assertCanCreateCustomPet(
  user: User
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (await hasUsedCustomPetSlot(user.id)) {
    return {
      ok: false,
      code: 'CUSTOM_PET_LIMIT',
      message: CUSTOM_PET_LIMIT_MESSAGE
    }
  }
  return { ok: true }
}

/** Reserve the one-time custom pet slot before starting generation. */
export async function reserveCustomPetSlot(
  userId: string
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  await syncCustomPetCreatedAt(userId)
  const result = await prisma.user.updateMany({
    where: { id: userId, customPetCreatedAt: null },
    data: { customPetCreatedAt: new Date() }
  })
  if (result.count === 0) {
    return {
      ok: false,
      code: 'CUSTOM_PET_LIMIT',
      message: CUSTOM_PET_LIMIT_MESSAGE
    }
  }
  return { ok: true }
}

export async function assertCanRegenerateCustomPet(
  user: User
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (await hasUsedCustomPetSlot(user.id)) {
    return {
      ok: false,
      code: 'CUSTOM_PET_LIMIT',
      message: CUSTOM_PET_LIMIT_MESSAGE
    }
  }
  return { ok: true }
}

export async function getCustomPetStatus(userId: string) {
  const createdAt = await syncCustomPetCreatedAt(userId)
  return {
    customPetCreated: createdAt !== null,
    customPetCreatedAt: createdAt?.toISOString() ?? null
  }
}
