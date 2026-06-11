import type { PetPoseType, PetStyleType } from './pet'

export type PetVisualState = PetPoseType

export type BubblePriority = 'high' | 'normal' | 'low'

export interface BubblePayload {
  text: string
  priority: BubblePriority
}

export interface FocusSession {
  id: string
  petId: string
  startTime: string
  endTime: string
  duration: number
  status: 'completed' | 'cancelled'
  expReward: number
  createdAt: string
}

export interface InteractionLog {
  id: string
  petId: string
  type: 'chat' | 'pomodoro' | 'sedentary' | 'daily_open'
  content: string
  createdAt: string
}

export interface GrowthBadge {
  id: string
  label: string
  earned: boolean
}

export interface GrowthStats {
  petId: string
  name: string
  styleType: PetStyleType
  styleLabel: string
  poseCount: number
  level: number
  exp: number
  expPercent: number
  nextLevelExp: number | null
  todayFocusCount: number
  streakDays: number
  lastInteractionAt: string | null
  badges: GrowthBadge[]
  recentInteractions: InteractionLog[]
}
