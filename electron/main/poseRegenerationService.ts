import type { PetPoseType } from '../../src/shared/types/pet'
import { runRegenerateSinglePose } from './image/pipeline'
import { notifyPetImageUpdated } from './windows'

let regenerating = false

export function isPoseRegenerationRunning(): boolean {
  return regenerating
}

export async function regeneratePetPose(
  petId: string,
  pose: PetPoseType
): Promise<
  | { success: true; petId: string; pose: PetPoseType }
  | { success: false; message: string }
> {
  if (regenerating) {
    return { success: false, message: '正在重生成姿势，请稍候。' }
  }

  regenerating = true
  try {
    const result = await runRegenerateSinglePose(petId, pose)
    if (result.success) {
      notifyPetImageUpdated(petId)
    }
    return result
  } finally {
    regenerating = false
  }
}
