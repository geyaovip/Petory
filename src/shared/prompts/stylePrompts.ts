import type { ReferenceMode } from '../generation/reference'
import type { PetPoseType } from '../types/pet'
import type { PetStyleType } from '../types/pet'
import { getPoseInstruction } from './posePrompts'
import { ANCHOR_STYLE_PROMPT_BASE, PETORY_STYLE_PROMPT_BASE } from './petoryStyle'

/**
 * Generation preserves the uploaded pet's identity and only changes pose.
 * styleType is kept for product/plan metadata; it must not restyle the subject.
 */
export function getStylePrompt(
  _styleType: PetStyleType,
  pose: PetPoseType = 'idle',
  referenceMode: ReferenceMode = 'upload'
): string {
  const poseRules = getPoseInstruction(pose)
  const base = referenceMode === 'anchor' ? ANCHOR_STYLE_PROMPT_BASE : PETORY_STYLE_PROMPT_BASE
  return `${base}\n${poseRules}`
}
