import type { BubblePayload, PetVisualState } from '../../src/shared/types/growth'
import { getPrimaryPetWindow } from './windows'
import { IPC } from '../../src/shared/ipc'

let currentState: PetVisualState = 'idle'
let revertTimer: ReturnType<typeof setTimeout> | null = null

export function getPetVisualState(): PetVisualState {
  return currentState
}

export function setPetVisualState(state: PetVisualState, revertToIdleMs?: number): void {
  currentState = state
  getPrimaryPetWindow()?.webContents.send(IPC.pet.stateChanged, state)

  if (revertToIdleMs && (state === 'angry' || state === 'happy')) {
    if (revertTimer) clearTimeout(revertTimer)
    revertTimer = setTimeout(() => {
      if (currentState === state) {
        setPetVisualState('idle')
      }
    }, revertToIdleMs)
  }
}

export function notifyBubble(payload: BubblePayload): void {
  getPrimaryPetWindow()?.webContents.send(IPC.pet.bubbleText, payload)
}
