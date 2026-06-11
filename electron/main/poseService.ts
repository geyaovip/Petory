import fs from 'fs'
import path from 'path'
import { BrowserWindow } from 'electron'
import { getPoseFileName, getPosesForPlan, PET_POSE_LABELS } from '../../src/shared/poses'
import type { PetVisualState } from '../../src/shared/types/growth'
import type {
  GenerationPhase,
  GenerationProgressPayload,
  Pet,
  PetPoseType
} from '../../src/shared/types/pet'
import { getCurrentUser } from './auth/authStore'
import { IPC } from '../../src/shared/ipc'
import { getPetDir, loadStore } from './petStore'

export function getPosesToGenerate(): PetPoseType[] {
  const plan = getCurrentUser()?.plan ?? 'free'
  return getPosesForPlan(plan)
}

export function getMissingPosesForPet(pet: Pet): PetPoseType[] {
  if (pet.isSample) return []
  if (!pet.imageCompressedPath || !fs.existsSync(pet.imageCompressedPath)) return []

  const target = getPosesToGenerate()
  return target.filter((pose) => {
    const posePath = pet.posePaths?.[pose]
    return !posePath || !fs.existsSync(posePath)
  })
}

export function listPetsNeedingPoseCompletion(): Array<{
  petId: string
  name: string
  missing: PetPoseType[]
}> {
  return loadStore()
    .pets.filter((pet) => pet.imagePetPath && (pet.status === 'active' || pet.status === 'generated'))
    .map((pet) => ({
      petId: pet.id,
      name: pet.name || '未命名',
      missing: getMissingPosesForPet(pet)
    }))
    .filter((item) => item.missing.length > 0)
}

export function resolvePoseImagePath(pet: Pet, pose: PetVisualState): string | null {
  const fromMap = pet.posePaths?.[pose]
  if (fromMap && fs.existsSync(fromMap)) return fromMap

  if (pose === 'idle' && pet.imagePetPath && fs.existsSync(pet.imagePetPath)) {
    return pet.imagePetPath
  }

  const fallback = pet.posePaths?.idle ?? pet.imagePetPath
  if (fallback && fs.existsSync(fallback)) return fallback
  return null
}

export function getPoseOutputPath(generatedDir: string, pose: PetPoseType): string {
  return path.join(generatedDir, getPoseFileName(pose))
}

export function broadcastGenerationProgress(payload: GenerationProgressPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.pet.generationProgress, payload)
    }
  }
}

export function broadcastPetsListChanged(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.pets.listChanged)
    }
  }
}

export function buildProgressPayload(
  petId: string,
  pose: PetPoseType,
  index: number,
  total: number,
  phase: GenerationPhase = 'local'
): GenerationProgressPayload {
  return {
    petId,
    pose,
    poseLabel: PET_POSE_LABELS[pose],
    index,
    total,
    phase
  }
}

export function broadcastGenerationPhase(
  petId: string,
  phase: GenerationPhase,
  poseLabel: string,
  total: number
): void {
  broadcastGenerationProgress({
    petId,
    poseLabel,
    index: 0,
    total,
    phase
  })
}

export function getGeneratedDir(petId: string): string {
  return path.join(getPetDir(petId), 'generated')
}
