import fs from 'fs'
import path from 'path'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from '../../src/shared/constants'
import type { UploadPayload } from '../../src/shared/ipc'
import { compressImage } from './image/compress'
import { createDraftPet, ensurePetDirs } from './petStore'

function getExtension(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext ?? null
}

export function validateUpload(payload: UploadPayload): boolean {
  const ext = getExtension(payload.fileName)
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return false
  }
  if (payload.mimeType) {
    const allowed =
      ALLOWED_MIME_TYPES.includes(payload.mimeType as (typeof ALLOWED_MIME_TYPES)[number]) ||
      payload.mimeType === 'image/jpg'
    if (!allowed) return false
  }
  return payload.data.byteLength <= MAX_UPLOAD_BYTES
}

export async function saveUpload(payload: UploadPayload): Promise<string> {
  if (!validateUpload(payload)) {
    throw new Error('upload_invalid')
  }

  const ext = getExtension(payload.fileName)!
  const pet = createDraftPet({
    imageOriginalPath: '',
    imageCompressedPath: ''
  })

  const { sourceDir } = ensurePetDirs(pet.id)
  const originalPath = path.join(sourceDir, `original.${ext}`)
  const compressedPath = path.join(sourceDir, 'compressed.png')

  fs.writeFileSync(originalPath, Buffer.from(payload.data))
  const compressed = await compressImage(Buffer.from(payload.data))
  fs.writeFileSync(compressedPath, compressed)

  const { updatePet } = await import('./petStore')
  updatePet(pet.id, {
    imageOriginalPath: originalPath,
    imageCompressedPath: compressedPath
  })

  return pet.id
}
