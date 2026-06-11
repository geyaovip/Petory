import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { getPoseFileName, PET_POSE_ORDER } from '../../src/shared/poses'
import type { PetPoseAssets } from '../../src/shared/types/pet'
import { canCreatePet } from './auth/entitlementService'
import { createDraftPet, ensurePetDirs, updatePet } from './petStore'

export type InstallSampleResult =
  | { success: true; petId: string }
  | { success: false; message: string }

function getSampleSvgPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'sample', 'pet.svg')
  }
  return path.join(app.getAppPath(), 'resources/sample/pet.svg')
}

export async function installSamplePet(): Promise<InstallSampleResult> {
  const quota = canCreatePet()
  if (!quota.ok) {
    return { success: false, message: quota.message }
  }

  const sampleSvg = getSampleSvgPath()
  if (!fs.existsSync(sampleSvg)) {
    return { success: false, message: '示例宠物资源缺失，请重新安装应用。' }
  }

  try {
    const pet = createDraftPet({ imageOriginalPath: '', imageCompressedPath: '' })
    const { sourceDir, generatedDir } = ensurePetDirs(pet.id)
    const sourceCopy = path.join(sourceDir, 'sample.svg')
    const petPngPath = path.join(generatedDir, 'pet.png')

    fs.copyFileSync(sampleSvg, sourceCopy)
    await sharp(sampleSvg)
      .resize(512, 640, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(petPngPath)

    const posePaths: PetPoseAssets = {}
    for (const pose of PET_POSE_ORDER) {
      const posePath = path.join(generatedDir, getPoseFileName(pose))
      fs.copyFileSync(petPngPath, posePath)
      posePaths[pose] = posePath
    }

    updatePet(pet.id, {
      imageOriginalPath: sourceCopy,
      imageCompressedPath: sourceCopy,
      imageMinimaxRawPath: petPngPath,
      imagePetPath: petPngPath,
      posePaths,
      status: 'generated',
      isSample: true
    })

    return { success: true, petId: pet.id }
  } catch (error) {
    console.error('[petory] install sample pet failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '示例宠物安装失败'
    }
  }
}
