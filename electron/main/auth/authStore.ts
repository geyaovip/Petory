import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AuthSession, AuthUser } from '../../../src/shared/types/auth'

const SESSION_FILE = 'auth-session.json'
const USERS_FILE = 'mock-users.json'

export interface MockUserRecord {
  id: string
  email: string
  password: string
  displayName: string
  plan: AuthUser['plan']
  createdAt: string
}

interface MockUsersFile {
  users: MockUserRecord[]
}

function getUserDataDir(): string {
  return app.getPath('userData')
}

function getSessionPath(): string {
  return path.join(getUserDataDir(), SESSION_FILE)
}

function getUsersPath(): string {
  return path.join(getUserDataDir(), USERS_FILE)
}

export function loadSession(): AuthSession | null {
  try {
    const raw = JSON.parse(fs.readFileSync(getSessionPath(), 'utf-8')) as AuthSession
    if (!raw?.user?.id) return null
    return raw
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  fs.mkdirSync(getUserDataDir(), { recursive: true })
  fs.writeFileSync(getSessionPath(), JSON.stringify(session, null, 2), 'utf-8')
}

export function clearSession(): void {
  const filePath = getSessionPath()
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

export function getCurrentUser(): AuthUser | null {
  return loadSession()?.user ?? null
}

export function getCurrentUserId(): string | null {
  return getCurrentUser()?.id ?? null
}

export function loadMockUsers(): MockUserRecord[] {
  try {
    const data = JSON.parse(fs.readFileSync(getUsersPath(), 'utf-8')) as MockUsersFile
    return data.users ?? []
  } catch {
    return []
  }
}

export function saveMockUsers(users: MockUserRecord[]): void {
  fs.mkdirSync(getUserDataDir(), { recursive: true })
  fs.writeFileSync(getUsersPath(), JSON.stringify({ users }, null, 2), 'utf-8')
}

export function findMockUserByEmail(email: string): MockUserRecord | undefined {
  const normalized = email.trim().toLowerCase()
  return loadMockUsers().find((user) => user.email === normalized)
}

export function updateMockUserPlan(userId: string, plan: AuthUser['plan']): void {
  const users = loadMockUsers()
  const index = users.findIndex((user) => user.id === userId)
  if (index < 0) return
  users[index] = { ...users[index], plan }
  saveMockUsers(users)

  const session = loadSession()
  if (session?.user.id === userId) {
    saveSession({
      ...session,
      user: { ...session.user, plan }
    })
  }
}
