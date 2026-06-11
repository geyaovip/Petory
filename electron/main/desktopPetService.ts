import { getStyleDefinition } from '../../src/shared/styles'
import type { DesktopPetStatus, PetDesktopSummary } from '../../src/shared/types/pet'
import { canShowPetOnDesktop, getLimitsForUser } from './auth/entitlementService'
import {
  countPetsOnDesktop,
  getActivePet,
  getPetById,
  getPetsOnDesktop,
  loadStore,
  setPetOnDesktop
} from './petStore'
import {
  closePetWindowFor,
  createPetWindowFor,
  syncDesktopPetWindows
} from './windows'

export function getDesktopPetStatus(): DesktopPetStatus {
  const store = loadStore()
  const limits = getLimitsForUser()
  const visible = getPetsOnDesktop()
  return {
    visiblePetIds: visible.map((pet) => pet.id),
    primaryPetId: store.activePetId,
    maxDesktopPets: limits.maxDesktopPets,
    visibleCount: visible.length
  }
}

export function listDesktopPetSummaries(): PetDesktopSummary[] {
  const activeId = loadStore().activePetId
  return loadStore()
    .pets.filter((pet) => pet.imagePetPath && (pet.status === 'active' || pet.status === 'generated'))
    .map((pet) => ({
      petId: pet.id,
      name: pet.name || '未命名',
      onDesktop: Boolean(pet.onDesktop),
      isPrimary: pet.id === activeId,
      styleLabel: getStyleDefinition(pet.styleType).labelZh
    }))
}

export function showPetOnDesktop(
  petId: string
): { success: true; pet: ReturnType<typeof getPetById> } | { success: false; message: string } {
  const check = canShowPetOnDesktop(petId)
  if (!check.ok) {
    return { success: false, message: check.message }
  }

  const pet = setPetOnDesktop(petId, true)
  createPetWindowFor(petId)
  return { success: true, pet }
}

export function hidePetFromDesktop(petId: string): void {
  setPetOnDesktop(petId, false)
  closePetWindowFor(petId)
}

export function syncAllDesktopPets(): void {
  syncDesktopPetWindows()
}

export function desktopPetCount(): number {
  return countPetsOnDesktop()
}
