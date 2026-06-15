import { PET_POSE_ORDER } from '../../../src/shared/poses.js'
import type { PetPoseType } from '../../../src/shared/types/pet.js'
import type { User } from '@prisma/client'

export function defaultPosesForUser(_user: User): PetPoseType[] {
  return PET_POSE_ORDER
}

export function validatePoses(
  user: User,
  poses: PetPoseType[]
): { ok: true; poses: PetPoseType[] } | { ok: false; code: string; message: string } {
  const allowed = new Set(defaultPosesForUser(user))
  const invalid = poses.filter((p) => !allowed.has(p))
  if (invalid.length > 0) {
    return {
      ok: false,
      code: 'POSE_LOCKED',
      message: `不支持的姿势：${invalid.join(', ')}`
    }
  }
  if (poses.length === 0) {
    return { ok: false, code: 'POSE_INVALID', message: '请指定至少一种姿势。' }
  }
  return { ok: true, poses }
}

export function parsePosesJson(raw: string | undefined, user: User): PetPoseType[] {
  if (!raw) return defaultPosesForUser(user)
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return defaultPosesForUser(user)
    return parsed.filter((p): p is PetPoseType => typeof p === 'string') as PetPoseType[]
  } catch {
    return defaultPosesForUser(user)
  }
}
