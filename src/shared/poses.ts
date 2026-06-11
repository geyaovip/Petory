import type { PetPoseType } from './types/pet'
import type { PlanTier } from './types/auth'

export const PET_POSE_ORDER: PetPoseType[] = [
  'idle',
  'happy',
  'focus',
  'sleep',
  'remind',
  'angry'
]

export const PET_POSE_LABELS: Record<PetPoseType, string> = {
  idle: '日常待机',
  happy: '开心',
  focus: '专注中',
  sleep: '睡觉',
  remind: '提醒你',
  angry: '小生气'
}

export const FREE_POSES: PetPoseType[] = ['idle', 'happy', 'remind']
export const PRO_POSES: PetPoseType[] = PET_POSE_ORDER

export function getPoseFileName(pose: PetPoseType): string {
  return `pose-${pose}.png`
}

export function getPosesForPlan(plan: PlanTier): PetPoseType[] {
  return plan === 'pro' ? PRO_POSES : FREE_POSES
}
