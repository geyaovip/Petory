import { getPosesForPlan } from '../../../src/shared/poses.js'
import { getStyleDefinition } from '../../../src/shared/styles.js'
import type { PlanTier } from '../../../src/shared/types/auth.js'
import type { PetPoseType, PetStyleType } from '../../../src/shared/types/pet.js'
import type { User } from '@prisma/client'

export function userPlan(user: User): PlanTier {
  return user.plan as PlanTier
}

export function canUseStyle(
  user: User,
  styleType: PetStyleType
): { ok: true } | { ok: false; code: string; message: string } {
  const style = getStyleDefinition(styleType)
  if (style.proOnly && userPlan(user) !== 'pro') {
    return {
      ok: false,
      code: 'STYLE_LOCKED',
      message: `「${style.labelZh}」为 Pro 专属风格，请升级 Pro 后使用。`
    }
  }
  return { ok: true }
}

export function defaultPosesForUser(user: User): PetPoseType[] {
  return getPosesForPlan(userPlan(user))
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
      message: `当前套餐不支持姿势：${invalid.join(', ')}`
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
