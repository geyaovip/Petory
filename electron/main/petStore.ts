import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { FinalizePetInput, Pet, PetStoreData } from '../../src/shared/types/pet'
import { getCurrentUserId } from './auth/authStore'
import {
  getDefaultPetWindowState,
  isLegacyPetPosition,
  loadWindowState,
  saveWindowState
} from './windowState'

const STORE_FILE = 'pets-store.json'
const DESKTOP_LAYOUT_VERSION = 4

function getStorePath(): string {
  return path.join(app.getPath('userData'), STORE_FILE)
}

function getPetsRoot(): string {
  return path.join(app.getPath('userData'), 'pets')
}

export function getPetDir(petId: string): string {
  return path.join(getPetsRoot(), petId)
}

function migrateStore(store: PetStoreData): PetStoreData {
  let changed = false
  const pets = store.pets.map((pet) => {
    let next = pet
    if (pet.onDesktop === undefined) {
      changed = true
      next = {
        ...next,
        onDesktop: pet.isActive && Boolean(pet.imagePetPath)
      }
    }
    if (!next.posePaths && next.imagePetPath) {
      changed = true
      next = {
        ...next,
        posePaths: { idle: next.imagePetPath }
      }
    }
    if (
      next.desktopX !== undefined &&
      next.desktopY !== undefined &&
      isLegacyPetPosition(next.desktopX, next.desktopY)
    ) {
      const def = getDefaultPetWindowState()
      changed = true
      next = { ...next, desktopX: def.x, desktopY: def.y }
    }
    return next
  })
  let next: PetStoreData = changed ? { ...store, pets } : store

  if ((next.desktopLayoutVersion ?? 1) < 2) {
    const def = getDefaultPetWindowState()
    const state = loadWindowState()
    let index = 0
    next = {
      ...next,
      desktopLayoutVersion: 2,
      pets: next.pets.map((pet) => {
        if (!pet.onDesktop || !pet.imagePetPath) return pet
        const offset = index * 36
        index += 1
        return {
          ...pet,
          desktopX: def.x + offset,
          desktopY: def.y + offset
        }
      })
    }
    saveWindowState({ ...state, x: def.x, y: def.y, width: state.width, height: state.height })
    saveStore(next)
    return next
  }

  // v3 briefly centered desktop pets — restore bottom-right without touching v2 layouts.
  if ((next.desktopLayoutVersion ?? 1) === 3) {
    const def = getDefaultPetWindowState()
    const state = loadWindowState()
    let index = 0
    next = {
      ...next,
      desktopLayoutVersion: DESKTOP_LAYOUT_VERSION,
      pets: next.pets.map((pet) => {
        if (!pet.onDesktop || !pet.imagePetPath) return pet
        const offset = index * 36
        index += 1
        return {
          ...pet,
          desktopX: def.x + offset,
          desktopY: def.y + offset
        }
      })
    }
    saveWindowState({ ...state, x: def.x, y: def.y, width: state.width, height: state.height })
    saveStore(next)
    return next
  }

  if (!changed) return store
  saveStore(next)
  return next
}

export function loadStore(): PetStoreData {
  try {
    const raw = fs.readFileSync(getStorePath(), 'utf-8')
    return migrateStore(JSON.parse(raw) as PetStoreData)
  } catch {
    return { activePetId: null, pets: [] }
  }
}

export function saveStore(store: PetStoreData): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getStorePath(), JSON.stringify(store, null, 2), 'utf-8')
}

export function getActivePet(): Pet | null {
  const store = loadStore()
  if (!store.activePetId) return null
  return store.pets.find((p) => p.id === store.activePetId && p.isActive) ?? null
}

export function getPetById(petId: string): Pet | null {
  return loadStore().pets.find((p) => p.id === petId) ?? null
}

export function createDraftPet(paths: {
  imageOriginalPath: string
  imageCompressedPath: string
}): Pet {
  const now = new Date().toISOString()
  const pet: Pet = {
    id: randomUUID(),
    userId: getCurrentUserId() ?? undefined,
    name: '',
    userCallName: '',
    imageOriginalPath: paths.imageOriginalPath,
    imageCompressedPath: paths.imageCompressedPath,
    imageMinimaxRawPath: '',
    imagePetPath: '',
    styleType: 'petory',
    personality: '温柔陪伴型',
    level: 1,
    exp: 0,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    isActive: false
  }

  const store = loadStore()
  store.pets.push(pet)
  saveStore(store)
  return pet
}

export function updatePet(petId: string, patch: Partial<Pet>): Pet {
  const store = loadStore()
  const index = store.pets.findIndex((p) => p.id === petId)
  if (index < 0) throw new Error(`Pet not found: ${petId}`)

  const updated: Pet = {
    ...store.pets[index],
    ...patch,
    updatedAt: new Date().toISOString()
  }
  store.pets[index] = updated
  saveStore(store)
  return updated
}

export function finalizePet(input: FinalizePetInput): Pet {
  const store = loadStore()
  store.pets = store.pets.map((p) => ({ ...p, isActive: false }))

  const index = store.pets.findIndex((p) => p.id === input.petId)
  if (index < 0) throw new Error(`Pet not found: ${input.petId}`)

  const updated: Pet = {
    ...store.pets[index],
    name: input.name.trim(),
    personality: input.personality,
    userCallName: input.userCallName.trim(),
    userId: store.pets[index].userId ?? getCurrentUserId() ?? undefined,
    status: 'active',
    isActive: true,
    onDesktop: true,
    updatedAt: new Date().toISOString()
  }
  store.pets[index] = updated
  store.activePetId = updated.id
  saveStore(store)
  return updated
}

export function activatePet(petId: string): Pet {
  const store = loadStore()
  const target = store.pets.find((p) => p.id === petId)
  if (!target?.imagePetPath) {
    throw new Error('Pet is not ready to activate')
  }

  store.pets = store.pets.map((p) => {
    if (p.id === petId) {
      return { ...p, isActive: true, status: 'active' as const }
    }
    if (p.isActive || p.status === 'active') {
      return { ...p, isActive: false, status: p.imagePetPath ? ('generated' as const) : p.status }
    }
    return { ...p, isActive: false }
  })
  store.activePetId = petId
  saveStore(store)
  return getPetById(petId)!
}

export function getPetsOnDesktop(): Pet[] {
  return loadStore().pets.filter((pet) => pet.onDesktop && pet.imagePetPath)
}

export function countPetsOnDesktop(): number {
  return getPetsOnDesktop().length
}

export function setPetOnDesktop(petId: string, onDesktop: boolean): Pet {
  return updatePet(petId, { onDesktop })
}

export function ensurePetDirs(petId: string): {
  sourceDir: string
  generatedDir: string
} {
  const base = getPetDir(petId)
  const sourceDir = path.join(base, 'source')
  const generatedDir = path.join(base, 'generated')
  fs.mkdirSync(sourceDir, { recursive: true })
  fs.mkdirSync(generatedDir, { recursive: true })
  return { sourceDir, generatedDir }
}
