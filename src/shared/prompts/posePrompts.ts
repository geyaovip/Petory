import type { PetPoseType } from '../types/pet'

const POSE_SCENE_RULES = `Full body, plain background, no text or extra objects. Same pet colors and markings as reference.`

const POSE_BODY: Record<PetPoseType, string> = {
  idle:
    'Pose only: same pet sitting in a relaxed front-facing 3/4 view, body slightly turned, face looking toward the viewer, calm gentle expression.',
  happy:
    'Pose only: same pet sitting in a front-facing 3/4 view, joyful cheerful expression, paws slightly open or raised in a cute happy gesture.',
  focus:
    'Pose only: same pet sitting in a front-facing 3/4 view, concentrated studious expression, holding a small book or laptop, calm focused mood.',
  sleep:
    'Pose only: same pet in a cozy sitting-sleep pose, eyes closed peacefully, relaxed posture while still mostly upright and desktop-friendly.',
  remind:
    'Pose only: same pet sitting in a front-facing 3/4 view, one paw raised in a friendly wave, attentive caring expression.',
  angry:
    'Pose only: same pet sitting in a front-facing 3/4 view, mildly pouty annoyed expression, cute-not-scary upset mood, small crossed arms or puffed cheeks.'
}

export function getPoseInstruction(pose: PetPoseType): string {
  return `${POSE_BODY[pose]} ${POSE_SCENE_RULES}`
}
