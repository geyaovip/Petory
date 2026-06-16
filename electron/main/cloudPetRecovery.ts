import path from 'path'
import type { ServerBatchResponse } from '../../src/shared/types/api'
import type { ImportCloudBatchResult, Pet, RecoverableCloudBatch } from '../../src/shared/types/pet'
import { apiFetch } from './api/client'
import { isAuthenticated } from './auth'
import { applyRemoteBatchToPet } from './image/pipeline'
import { downloadImage } from './image/remoteGeneration'
import { hasUploadReference } from './image/referencePath'
import {
  createDraftPet,
  ensurePetDirs,
  getPetById,
  loadStore,
  updatePet
} from './petStore'

function listImportedCloudBatchIds(): Set<string> {
  return new Set(
    loadStore()
      .pets.map((pet) => pet.cloudBatchId)
      .filter((batchId): batchId is string => Boolean(batchId))
  )
}

function toRecoverableBatch(batch: ServerBatchResponse): RecoverableCloudBatch | null {
  if (batch.status !== 'succeeded') return null
  const idleJob = batch.jobs.find((job) => job.pose === 'idle' && job.status === 'succeeded')
  if (!idleJob?.rawOutputUrl) return null
  return {
    batchId: batch.batchId,
    createdAt: batch.createdAt ?? new Date().toISOString(),
    posesSucceeded: batch.posesSucceeded,
    posesTotal: batch.posesTotal,
    previewUrl: idleJob.rawOutputUrl
  }
}

export async function listRecoverableCloudBatches(): Promise<RecoverableCloudBatch[]> {
  if (!isAuthenticated()) return []

  try {
    const data = await apiFetch<{ batches: ServerBatchResponse[] }>('/api/generation/recoverable')
    const imported = listImportedCloudBatchIds()
    return (data.batches ?? [])
      .filter((batch) => !imported.has(batch.batchId))
      .map(toRecoverableBatch)
      .filter((batch): batch is RecoverableCloudBatch => batch !== null)
  } catch (error) {
    console.warn('[petory] failed to list recoverable cloud batches:', error)
    return []
  }
}

export async function importCloudBatch(batchId: string): Promise<ImportCloudBatchResult> {
  if (!isAuthenticated()) {
    return { success: false, message: '请先登录后再导入。' }
  }

  const existing = loadStore().pets.find((pet) => pet.cloudBatchId === batchId)
  if (existing) {
    return { success: true, petId: existing.id }
  }

  let batch: ServerBatchResponse
  try {
    batch = await apiFetch<ServerBatchResponse>(`/api/generation/batch/${batchId}`)
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '读取云端生成记录失败。'
    }
  }

  if (batch.status !== 'succeeded') {
    return { success: false, message: '该批次尚未生成完成，暂时无法导入。' }
  }

  const pet = createDraftPet({ imageOriginalPath: '', imageCompressedPath: '' })
  const { sourceDir } = ensurePetDirs(pet.id)

  if (batch.inputImageUrl) {
    const sourcePath = path.join(sourceDir, 'upload.png')
    try {
      await downloadImage(batch.inputImageUrl, sourcePath)
      updatePet(pet.id, {
        imageOriginalPath: sourcePath,
        imageCompressedPath: sourcePath
      })
    } catch (error) {
      console.warn('[petory] failed to download cloud batch source image:', error)
    }
  }

  const result = await applyRemoteBatchToPet(pet.id, batch.jobs)
  if (!result.success) {
    return { success: false, message: result.message }
  }

  updatePet(pet.id, { cloudBatchId: batchId })
  return { success: true, petId: pet.id }
}

export function isManagedPetCandidate(pet: Pet): boolean {
  if (pet.isSample) return pet.status === 'active' || pet.status === 'generated'
  if (pet.status === 'active' || pet.status === 'generated') return true
  return pet.status === 'draft' && hasUploadReference(pet)
}
