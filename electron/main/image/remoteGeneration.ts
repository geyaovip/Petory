import fs from 'fs'
import path from 'path'
import type { ReferenceMode } from '../../../src/shared/generation/reference'
import type { PetPoseType, PetStyleType } from '../../../src/shared/types/pet'
import type { ServerBatchResponse, ServerJobResponse } from '../../../src/shared/types/api'
import { apiFetch } from '../api/client'
import { getLocalDeviceId } from '../api/deviceId'
import { applyQuotaFromResponse } from '../api/remoteQuotaStore'
import { prepareReferenceFromPath } from './prepareReference'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 800

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  return 'image/png'
}

async function imageToBlob(
  imagePath: string,
  referenceMode: ReferenceMode
): Promise<{ blob: Blob; filename: string }> {
  const prepared = await prepareReferenceFromPath(imagePath, referenceMode)
  const ext = prepared.mimeType === 'image/jpeg' ? 'jpg' : 'png'
  const arrayBuffer = prepared.buffer.buffer.slice(
    prepared.buffer.byteOffset,
    prepared.buffer.byteOffset + prepared.buffer.byteLength
  ) as ArrayBuffer
  const blob = new Blob(
    [arrayBuffer],
    { type: prepared.mimeType }
  )
  console.info(
    `[petory] remote upload reference: ${imagePath} (source=${prepared.sourceBytes}B → prepared=${prepared.preparedBytes}B, mode=${referenceMode})`
  )
  return { blob, filename: `reference.${ext}` }
}

async function buildFormData(input: {
  imagePath: string
  referenceMode: ReferenceMode
  styleType: PetStyleType
  deviceId: string
  poses?: PetPoseType[]
  pose?: PetPoseType
}): Promise<FormData> {
  const form = new FormData()
  const { blob, filename } = await imageToBlob(input.imagePath, input.referenceMode)
  form.append('image', blob, filename)
  form.append('styleType', input.styleType)
  form.append('deviceId', input.deviceId)
  if (input.poses) form.append('poses', JSON.stringify(input.poses))
  if (input.pose) form.append('pose', input.pose)
  return form
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return status === 0 || status === 408 || status === 429 || status >= 500
}

async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      lastError = error
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status: number }).status)
          : 0
      if (attempt >= MAX_RETRIES || !isRetryableStatus(status)) {
        throw error
      }
      console.warn(`[petory] ${label} failed (attempt ${attempt + 1}), retrying…`, error)
      await sleep(RETRY_DELAY_MS * (attempt + 1))
    }
  }
  throw lastError
}

export async function consumeRemoteGenerationQuota(): Promise<void> {
  const data = await apiFetch<{ quota?: ServerBatchResponse['quota'] }>('/api/generation/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: getLocalDeviceId() })
  })
  if (data.quota) applyQuotaFromResponse({ quota: data.quota })
}

export async function logLocalGenerationBatch(input: {
  styleType: PetStyleType
  poses: PetPoseType[]
  clientPetId: string
}): Promise<void> {
  try {
    await apiFetch('/api/generation/log-local-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: getLocalDeviceId(),
        styleType: input.styleType,
        poses: input.poses,
        clientPetId: input.clientPetId
      })
    })
  } catch (error) {
    console.warn('[petory] failed to log local generation batch for admin:', error)
  }
}

export async function requestGenerationBatch(input: {
  imagePath: string
  referenceMode: ReferenceMode
  styleType: PetStyleType
  poses?: PetPoseType[]
}): Promise<ServerBatchResponse> {
  const form = await buildFormData({
    imagePath: input.imagePath,
    referenceMode: input.referenceMode,
    styleType: input.styleType,
    deviceId: getLocalDeviceId(),
    poses: input.poses
  })
  const data = await withRetry('generation batch', () =>
    apiFetch<ServerBatchResponse>('/api/generation/batch', {
      method: 'POST',
      body: form
    })
  )
  if (data.quota) applyQuotaFromResponse({ quota: data.quota })
  return data
}

export async function requestPoseCompletion(input: {
  imagePath: string
  referenceMode: ReferenceMode
  styleType: PetStyleType
  poses: PetPoseType[]
}): Promise<ServerBatchResponse> {
  const form = await buildFormData({
    imagePath: input.imagePath,
    referenceMode: input.referenceMode,
    styleType: input.styleType,
    deviceId: getLocalDeviceId(),
    poses: input.poses
  })
  const data = await withRetry('pose completion', () =>
    apiFetch<ServerBatchResponse>('/api/generation/complete-poses', {
      method: 'POST',
      body: form
    })
  )
  if (data.quota) applyQuotaFromResponse({ quota: data.quota })
  return data
}

export async function requestPoseRegeneration(input: {
  imagePath: string
  referenceMode: ReferenceMode
  styleType: PetStyleType
  pose: PetPoseType
}): Promise<ServerJobResponse> {
  const form = await buildFormData({
    imagePath: input.imagePath,
    referenceMode: input.referenceMode,
    styleType: input.styleType,
    deviceId: getLocalDeviceId(),
    pose: input.pose
  })
  const data = await withRetry('pose regeneration', () =>
    apiFetch<ServerJobResponse>('/api/generation/regenerate-pose', {
      method: 'POST',
      body: form
    })
  )
  if (data.quota) applyQuotaFromResponse({ quota: data.quota })
  return data
}

export async function downloadImage(url: string, targetPath: string): Promise<void> {
  await withRetry('image download', async () => {
    const response = await fetch(url)
    if (!response.ok) {
      const err = new Error(`下载生成图失败：HTTP ${response.status}`)
      Object.assign(err, { status: response.status })
      throw err
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.writeFileSync(targetPath, buffer)
  })
}
