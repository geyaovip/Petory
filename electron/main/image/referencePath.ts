import fs from 'fs'
import type { Pet } from '../../../src/shared/types/pet'

/** Prefer the user's original upload for image-to-image generation. */
export function resolveUploadReferencePath(pet: Pet): string | null {
  if (pet.imageOriginalPath && fs.existsSync(pet.imageOriginalPath)) {
    return pet.imageOriginalPath
  }
  if (pet.imageCompressedPath && fs.existsSync(pet.imageCompressedPath)) {
    return pet.imageCompressedPath
  }
  return null
}

export function hasUploadReference(pet: Pet): boolean {
  return resolveUploadReferencePath(pet) !== null
}
