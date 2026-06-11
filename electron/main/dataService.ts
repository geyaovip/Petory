import {
  PETORY_DOWNLOAD_PAGE,
  PETORY_PRIVACY_URL,
  PETORY_TERMS_URL,
  PETORY_WEBSITE_URL
} from '../../src/shared/constants'
import { app, dialog, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { clearAuthData } from './auth'
import { clearLegalAcceptance } from './legalStore'
import { clearChatHistory } from './chatStore'
import { getPetDir, loadStore, saveStore } from './petStore'
import type { PetStoreData } from '../../src/shared/types/pet'

const DATA_FILES = [
  'pets-store.json',
  'user-settings.json',
  'chat-history.json',
  'pet-stats.json',
  'focus-sessions.json',
  'interaction-log.json',
  'window-state.json',
  'usage-log.json',
  'legal-acceptance.json'
] as const

export const EXPORT_SCHEMA_VERSION = 3

export interface PetFileEntry {
  petId: string
  relativePath: string
  data: string
}

export interface ExportBundle {
  schemaVersion: number
  exportedAt: string
  version: string
  userDataRoot: string
  syncNote?: string
  petFiles?: PetFileEntry[]
  [key: string]: unknown
}

function getUserDataPath(): string {
  return app.getPath('userData')
}

function getPetsRoot(): string {
  return path.join(getUserDataPath(), 'pets')
}

function collectPetFiles(): PetFileEntry[] {
  const petsRoot = getPetsRoot()
  if (!fs.existsSync(petsRoot)) return []

  const entries: PetFileEntry[] = []
  for (const petId of fs.readdirSync(petsRoot)) {
    const petDir = path.join(petsRoot, petId)
    if (!fs.statSync(petDir).isDirectory()) continue

    const walk = (dir: string, prefix: string): void => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        const rel = prefix ? `${prefix}/${name}` : name
        if (fs.statSync(full).isDirectory()) {
          walk(full, rel)
        } else {
          entries.push({
            petId,
            relativePath: rel,
            data: fs.readFileSync(full).toString('base64')
          })
        }
      }
    }
    walk(petDir, '')
  }
  return entries
}

export function exportLocalData(): { success: true; path: string } | { success: false; message: string } {
  try {
    const userData = getUserDataPath()
    const exportDir = path.join(userData, 'exports')
    fs.mkdirSync(exportDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const target = path.join(exportDir, `petory-export-${stamp}.json`)

    const bundle: ExportBundle = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      version: app.getVersion(),
      userDataRoot: userData,
      syncNote:
        'Full local backup including pet images. Import on a new machine restores pets and settings; sign in again with your account.',
      petFiles: collectPetFiles()
    }

    for (const file of DATA_FILES) {
      const filePath = path.join(userData, file)
      if (fs.existsSync(filePath)) {
        bundle[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      }
    }

    fs.writeFileSync(target, JSON.stringify(bundle, null, 2), 'utf-8')
    return { success: true, path: target }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '导出失败'
    }
  }
}

function remapPaths<T>(value: T, oldRoot: string, newRoot: string): T {
  if (typeof value === 'string') {
    if (value.startsWith(oldRoot)) {
      return value.replace(oldRoot, newRoot) as T
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => remapPaths(item, oldRoot, newRoot)) as T
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      next[key] = remapPaths(item, oldRoot, newRoot)
    }
    return next as T
  }
  return value
}

function writePreImportBackup(userData: string): string {
  const backupDir = path.join(userData, 'exports', `pre-import-${Date.now()}`)
  fs.mkdirSync(backupDir, { recursive: true })
  for (const file of DATA_FILES) {
    const src = path.join(userData, file)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupDir, file))
    }
  }
  const petsRoot = getPetsRoot()
  if (fs.existsSync(petsRoot)) {
    fs.cpSync(petsRoot, path.join(backupDir, 'pets'), { recursive: true })
  }
  return backupDir
}

function restorePetFiles(petFiles: PetFileEntry[]): number {
  let count = 0
  for (const entry of petFiles) {
    const target = path.join(getPetsRoot(), entry.petId, entry.relativePath)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, Buffer.from(entry.data, 'base64'))
    count += 1
  }
  return count
}

function parseBundle(raw: string): ExportBundle {
  const bundle = JSON.parse(raw) as ExportBundle
  if (!bundle.schemaVersion || bundle.schemaVersion < 2) {
    throw new Error('不支持的备份格式，请使用较新版本导出的文件。')
  }
  return bundle
}

export function importLocalDataFromPath(
  sourcePath: string
): { success: true; backupDir: string; petFileCount: number } | { success: false; message: string } {
  try {
    if (!fs.existsSync(sourcePath)) {
      return { success: false, message: '文件不存在。' }
    }

    const bundle = parseBundle(fs.readFileSync(sourcePath, 'utf-8'))
    const userData = getUserDataPath()
    const backupDir = writePreImportBackup(userData)
    const oldRoot = bundle.userDataRoot || userData

    let petFileCount = 0
    if (bundle.petFiles?.length) {
      const petsRoot = getPetsRoot()
      if (fs.existsSync(petsRoot)) {
        fs.rmSync(petsRoot, { recursive: true, force: true })
      }
      petFileCount = restorePetFiles(bundle.petFiles)
    } else if (bundle.schemaVersion < 3) {
      console.warn('[petory] import: bundle has no petFiles — image paths may be broken on new machine')
    }

    for (const file of DATA_FILES) {
      if (!(file in bundle)) continue
      let payload = bundle[file]
      if (file === 'pets-store.json') {
        payload = remapPaths(payload as PetStoreData, oldRoot, userData)
      } else if (typeof payload === 'object' && payload !== null) {
        payload = remapPaths(payload, oldRoot, userData)
      }
      fs.mkdirSync(userData, { recursive: true })
      fs.writeFileSync(path.join(userData, file), JSON.stringify(payload, null, 2), 'utf-8')
    }

    return { success: true, backupDir, petFileCount }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '导入失败'
    }
  }
}

export async function pickAndImportLocalData(): Promise<
  | { success: true; backupDir: string; petFileCount: number; sourcePath: string }
  | { success: false; message: string; cancelled?: boolean }
> {
  const result = await dialog.showOpenDialog({
    title: '导入 Petory 备份',
    properties: ['openFile'],
    filters: [{ name: 'Petory Backup', extensions: ['json'] }]
  })

  if (result.canceled || !result.filePaths[0]) {
    return { success: false, message: '已取消导入。', cancelled: true }
  }

  const imported = importLocalDataFromPath(result.filePaths[0])
  if (!imported.success) return imported
  return { ...imported, sourcePath: result.filePaths[0] }
}

export function clearChatData(petId?: string): void {
  clearChatHistory(petId)
}

export function deletePetImages(petId: string): void {
  const petDir = getPetDir(petId)
  if (fs.existsSync(petDir)) {
    fs.rmSync(petDir, { recursive: true, force: true })
  }
}

export function wipeAllLocalData(): void {
  const userData = getUserDataPath()
  const allFiles = [...DATA_FILES, 'auth-session.json', 'mock-users.json', 'device-id.json']

  for (const file of allFiles) {
    const filePath = path.join(userData, file)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  const petsRoot = path.join(userData, 'pets')
  if (fs.existsSync(petsRoot)) {
    fs.rmSync(petsRoot, { recursive: true, force: true })
  }

  saveStore({ activePetId: null, pets: [] })
  clearAuthData()
  clearLegalAcceptance()
}

export function listManagedPets() {
  return loadStore().pets.filter((p) => p.status === 'active' || p.status === 'generated')
}

export function openFeedbackUrl(): void {
  const explicit = process.env['PETORY_GITHUB_ISSUES_URL']?.trim()
  if (explicit) {
    void shell.openExternal(explicit)
    return
  }

  const repo = process.env['PETORY_GITHUB_REPO']?.trim() || 'petory-app/petory'
  void shell.openExternal(`https://github.com/${repo}/issues/new`)
}

export function openWebsiteUrl(): void {
  void shell.openExternal(PETORY_WEBSITE_URL)
}

export function openDownloadPageUrl(): void {
  void shell.openExternal(PETORY_DOWNLOAD_PAGE)
}

export function openPrivacyUrl(): void {
  void shell.openExternal(PETORY_PRIVACY_URL)
}

export function openTermsUrl(): void {
  void shell.openExternal(PETORY_TERMS_URL)
}
