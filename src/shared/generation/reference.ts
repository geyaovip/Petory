import { PET_POSE_ORDER } from '../poses'
import type { PetPoseType } from '../types/pet'

export type ReferenceMode = 'upload' | 'anchor'

export function sortPosesIdleFirst(poses: PetPoseType[]): PetPoseType[] {
  const order = new Map(PET_POSE_ORDER.map((pose, index) => [pose, index]))
  return [...poses].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
}

export function seedFromString(value: string): number {
  let hash = 0
  for (const ch of value) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  }
  return (hash % 2_147_483_646) + 1
}
