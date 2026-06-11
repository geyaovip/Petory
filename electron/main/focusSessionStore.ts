import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { FocusSession } from '../../src/shared/types/growth'

const SESSIONS_FILE = 'focus-sessions.json'

function getPath(): string {
  return path.join(app.getPath('userData'), SESSIONS_FILE)
}

function loadSessions(): FocusSession[] {
  try {
    return JSON.parse(fs.readFileSync(getPath(), 'utf-8')) as FocusSession[]
  } catch {
    return []
  }
}

function saveSessions(sessions: FocusSession[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getPath(), JSON.stringify(sessions, null, 2), 'utf-8')
}

export function addFocusSession(input: Omit<FocusSession, 'id' | 'createdAt'>): FocusSession {
  const session: FocusSession = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  }
  const sessions = loadSessions()
  sessions.push(session)
  saveSessions(sessions)
  return session
}

export function getFocusSessionsForPet(petId: string): FocusSession[] {
  return loadSessions().filter((s) => s.petId === petId)
}
