import type { EntitlementLimits } from './auth'
import type { ChatMessage } from './chat'
import type { PetPersonality } from './pet'

export interface ServerQuotaView {
  dailyLimit: number
  usedToday: number
  remainingToday: number
  bonusQuota?: number
  totalUsed?: number
  isProUser?: boolean
}

export interface AppStatusResponse {
  version: string
  registrationOpen: boolean
  generationServiceEnabled: boolean
  chatServiceEnabled: boolean
  paymentEnabled: boolean
  mockPaymentEnabled: boolean
  maintenanceNotice: string | null
  limits: {
    free: { dailyGenerationLimit: number; dailyChatLimit: number }
    pro: { dailyGenerationLimit: number; dailyChatLimit: number }
  }
}

export interface ServerAuthUser {
  id: string
  email: string
  displayName: string
  plan: 'free' | 'pro'
  status?: string
  proExpiresAt?: string | null
  createdAt: string
  limits: EntitlementLimits
}

export interface ServerBatchJob {
  jobId: string
  pose: string
  poseLabel?: string
  status: string
  rawOutputUrl: string | null
  errorMessage?: string | null
  durationMs?: number | null
}

export interface ServerBatchResponse {
  batchId: string
  jobType: string
  styleType: string
  status: string
  posesTotal: number
  posesSucceeded: number
  createdAt?: string
  updatedAt?: string
  inputImageUrl?: string | null
  jobs: ServerBatchJob[]
  quota?: ServerQuotaView
  success?: boolean
  code?: string
  message?: string
}

export interface ServerJobResponse {
  jobId: string
  pose: string
  status: string
  rawOutputUrl: string | null
  errorMessage?: string | null
  quota?: ServerQuotaView
  success?: boolean
  code?: string
  message?: string
}

export interface ServerChatSendInput {
  message: string
  history?: ChatMessage[]
  pet: {
    petId?: string
    name: string
    personality: PetPersonality
    userCallName?: string
  }
}

export type ServerChatSendResponse =
  | {
      success: true
      message: ChatMessage
      bubbleText?: string
      chatQuota?: ServerQuotaView
      code?: string
    }
  | {
      success: false
      message?: string
      bubbleText?: string
      chatQuota?: ServerQuotaView
      code?: string
    }
