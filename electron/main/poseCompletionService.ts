import { runCompletePosesPipeline } from './image/pipeline'
import { listPetsNeedingPoseCompletion } from './poseService'
import { notifyPetImageUpdated } from './windows'

let completing = false

export function isPoseCompletionRunning(): boolean {
  return completing
}

export async function completeMissingPosesForAllPets(): Promise<{
  completed: Array<{ petId: string; addedCount: number }>
  failed: Array<{ petId: string; message: string }>
}> {
  if (completing) {
    return { completed: [], failed: [] }
  }

  completing = true
  const completed: Array<{ petId: string; addedCount: number }> = []
  const failed: Array<{ petId: string; message: string }> = []

  try {
    const pending = listPetsNeedingPoseCompletion()
    for (const item of pending) {
      const result = await runCompletePosesPipeline(item.petId)
      if (!result.success) {
        failed.push({ petId: item.petId, message: result.message })
        continue
      }
      if ('addedPoses' in result && result.addedPoses.length > 0) {
        completed.push({ petId: item.petId, addedCount: result.addedPoses.length })
        notifyPetImageUpdated(item.petId)
      }
    }
  } finally {
    completing = false
  }

  return { completed, failed }
}
