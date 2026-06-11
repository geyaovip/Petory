import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const STATS_FILE = 'pet-stats.json'

export interface PetStats {
  petId: string
  lastOpenDate: string | null
  streakDays: number
  todayFocusCount: number
  lastInteractionAt: string | null
  sedentarySkipCount: number
  lastSedentaryAt: number | null
}

interface StatsFile {
  byPet: Record<string, PetStats>
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function getStatsPath(): string {
  return path.join(app.getPath('userData'), STATS_FILE)
}

function loadFile(): StatsFile {
  try {
    return JSON.parse(fs.readFileSync(getStatsPath(), 'utf-8')) as StatsFile
  } catch {
    return { byPet: {} }
  }
}

function saveFile(data: StatsFile): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getStatsPath(), JSON.stringify(data, null, 2), 'utf-8')
}

function defaultStats(petId: string): PetStats {
  return {
    petId,
    lastOpenDate: null,
    streakDays: 0,
    todayFocusCount: 0,
    lastInteractionAt: null,
    sedentarySkipCount: 0,
    lastSedentaryAt: null
  }
}

export function getPetStats(petId: string): PetStats {
  const file = loadFile()
  const stats = file.byPet[petId] ?? defaultStats(petId)
  if (stats.lastOpenDate !== todayKey()) {
    stats.todayFocusCount = 0
  }
  return stats
}

export function updatePetStats(petId: string, patch: Partial<PetStats>): PetStats {
  const file = loadFile()
  const current = file.byPet[petId] ?? defaultStats(petId)
  const updated = { ...current, ...patch, petId }
  file.byPet[petId] = updated
  saveFile(file)
  return updated
}

export function touchInteraction(petId: string): void {
  updatePetStats(petId, { lastInteractionAt: new Date().toISOString() })
}

export function incrementTodayFocus(petId: string): number {
  const stats = getPetStats(petId)
  const today = todayKey()
  const count = stats.lastOpenDate === today ? stats.todayFocusCount + 1 : 1
  updatePetStats(petId, { todayFocusCount: count, lastOpenDate: today })
  return count
}

export function processDailyOpen(petId: string): { isFirstToday: boolean; streakDays: number } {
  const stats = getPetStats(petId)
  const today = todayKey()
  if (stats.lastOpenDate === today) {
    return { isFirstToday: false, streakDays: stats.streakDays }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const streakDays = stats.lastOpenDate === yesterdayKey ? stats.streakDays + 1 : 1

  updatePetStats(petId, { lastOpenDate: today, streakDays, todayFocusCount: 0 })
  return { isFirstToday: true, streakDays }
}
