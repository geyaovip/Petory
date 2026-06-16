import fs from 'fs'
import path from 'path'
import { PET_POSE_ORDER } from '../../src/shared/poses'
import type { Pet, PetPoseAssets } from '../../src/shared/types/pet'
import { getPoseOutputPath } from './poseService'
import { ensurePetDirs, loadStore, saveStore } from './petStore'

/** Promote draft pets whose pose files already exist on disk (e.g. generation finished after closing onboarding). */
export function syncPetStatusFromDisk(): boolean {
  const store = loadStore()
  let changed = false

  const pets = store.pets.map((pet) => {
    if (pet.status !== 'draft' || pet.isSample) return pet

    const { generatedDir } = ensurePetDirs(pet.id)
    const idlePath = getPoseOutputPath(generatedDir, 'idle')
    if (!fs.existsSync(idlePath)) return pet

    const posePaths: PetPoseAssets = { ...(pet.posePaths ?? {}) }
    for (const pose of PET_POSE_ORDER) {
      const posePath = getPoseOutputPath(generatedDir, pose)
      if (fs.existsSync(posePath)) {
        posePaths[pose] = posePath
      }
    }

    const minimaxIdle = path.join(generatedDir, 'minimax_idle.png')
    changed = true
    return {
      ...pet,
      imagePetPath: idlePath,
      posePaths,
      status: 'generated' as const,
      imageMinimaxRawPath:
        pet.imageMinimaxRawPath && fs.existsSync(pet.imageMinimaxRawPath)
          ? pet.imageMinimaxRawPath
          : fs.existsSync(minimaxIdle)
            ? minimaxIdle
            : pet.imageMinimaxRawPath
    }
  })

  if (!changed) return false
  saveStore({ ...store, pets })
  return true
}

export function petNeedsFinalize(pet: Pet): boolean {
  return (
    !pet.isSample &&
    pet.status === 'generated' &&
    !pet.name.trim() &&
    Boolean(pet.imagePetPath)
  )
}

export function findPetAwaitingFinalize(): Pet | null {
  const candidates = loadStore()
    .pets.filter((pet) => petNeedsFinalize(pet))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return candidates[0] ?? null
}
