import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { InteractionLog } from '../../src/shared/types/growth'

const LOG_FILE = 'interaction-log.json'

function getPath(): string {
  return path.join(app.getPath('userData'), LOG_FILE)
}

function loadLogs(): InteractionLog[] {
  try {
    return JSON.parse(fs.readFileSync(getPath(), 'utf-8')) as InteractionLog[]
  } catch {
    return []
  }
}

function saveLogs(logs: InteractionLog[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getPath(), JSON.stringify(logs, null, 2), 'utf-8')
}

export function appendInteraction(
  petId: string,
  type: InteractionLog['type'],
  content: string
): void {
  const log: InteractionLog = {
    id: randomUUID(),
    petId,
    type,
    content,
    createdAt: new Date().toISOString()
  }
  const logs = loadLogs()
  logs.push(log)
  if (logs.length > 500) {
    logs.splice(0, logs.length - 500)
  }
  saveLogs(logs)
}

export function getRecentInteractions(petId: string, limit = 5): InteractionLog[] {
  return loadLogs()
    .filter((log) => log.petId === petId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function hasInteractionType(petId: string, type: InteractionLog['type']): boolean {
  return loadLogs().some((log) => log.petId === petId && log.type === type)
}
