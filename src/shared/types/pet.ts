export type PetStyleType = 'petory' | 'pixel' | 'sticker' | 'plush' | 'clay' | 'cyber'

export type PetPoseType = 'idle' | 'happy' | 'sleep' | 'focus' | 'remind' | 'angry'

export type PetPoseAssets = Partial<Record<PetPoseType, string>>

export type GenerationPhase = 'upload' | 'remote' | 'local'

export interface GenerationProgressPayload {
  petId: string
  pose?: PetPoseType
  poseLabel: string
  index: number
  total: number
  phase?: GenerationPhase
}

export type PetPersonality =
  | '温柔陪伴型'
  | '元气鼓励型'
  | '傲娇吐槽型'
  | '安静治愈型'
  | '严格监督型'

export type PetStatus = 'draft' | 'generated' | 'active'

export interface Pet {
  id: string
  /** Linked account id — reserved for cloud sync (V1.0+). */
  userId?: string
  name: string
  userCallName: string
  imageOriginalPath: string
  imageCompressedPath: string
  imageMinimaxRawPath: string
  imagePetPath: string
  /** Per-state pose images (transparent PNG). */
  posePaths?: PetPoseAssets
  styleType: PetStyleType
  personality: PetPersonality
  level: number
  exp: number
  status: PetStatus
  createdAt: string
  updatedAt: string
  isActive: boolean
  /** Visible as a desktop overlay window. */
  onDesktop?: boolean
  desktopX?: number
  desktopY?: number
  /** Built-in demo pet — no MiniMax generation. */
  isSample?: boolean
}

export interface PetDesktopSummary {
  petId: string
  name: string
  onDesktop: boolean
  isPrimary: boolean
  styleLabel: string
}

export interface DesktopPetStatus {
  visiblePetIds: string[]
  primaryPetId: string | null
  maxDesktopPets: number
  visibleCount: number
}

export type DesktopPetResult =
  | { success: true; pet: Pet }
  | { success: false; message: string }

export interface PoseCompletionPending {
  petId: string
  name: string
  missing: PetPoseType[]
}

export interface PoseCompletionStatus {
  running: boolean
  pending: PoseCompletionPending[]
}

export type CompletePosesResult =
  | { success: true; petId: string; addedPoses: PetPoseType[] }
  | { success: true; completed: Array<{ petId: string; addedCount: number }>; failed: Array<{ petId: string; message: string }> }
  | { success: false; message: string }

export type RegeneratePoseResult =
  | { success: true; petId: string; pose: PetPoseType }
  | { success: false; message: string }

export type InstallSampleResult =
  | { success: true; petId: string }
  | { success: false; message: string }

export type ActivatePetResult =
  | { success: true; pet: Pet }
  | { success: false; message: string }

export interface PetStoreData {
  activePetId: string | null
  pets: Pet[]
  /** Bumped when desktop pet default placement changes (e.g. move to bottom-right). */
  desktopLayoutVersion?: number
}

export type GenerationErrorCode =
  | 'upload_invalid'
  | 'generation_failed'
  | 'rembg_failed'
  | 'quota_exceeded'
  | 'style_locked'
  | 'auth_expired'
  | 'service_disabled'
  | 'network_error'
  | 'rate_limit'

export interface UploadResult {
  petId: string
}

export interface GenerationResult {
  petId: string
  success: true
}

export interface GenerationFailure {
  success: false
  code: GenerationErrorCode
  message: string
}

export interface FinalizePetInput {
  petId: string
  name: string
  personality: PetPersonality
  userCallName: string
}

export type PetIpcResult = GenerationResult | GenerationFailure
