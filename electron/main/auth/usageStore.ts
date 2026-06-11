import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { UsageSnapshot } from '../../../src/shared/types/auth'

const USAGE_FILE = 'usage-log.json'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function getUsagePath(): string {
  return path.join(app.getPath('userData'), USAGE_FILE)
}

function defaultUsage(): UsageSnapshot {
  return { date: todayKey(), chatCount: 0, generationCount: 0 }
}

export function loadUsage(): UsageSnapshot {
  try {
    const raw = JSON.parse(fs.readFileSync(getUsagePath(), 'utf-8')) as UsageSnapshot
    if (raw.date !== todayKey()) return defaultUsage()
    return raw
  } catch {
    return defaultUsage()
  }
}

function saveUsage(usage: UsageSnapshot): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getUsagePath(), JSON.stringify(usage, null, 2), 'utf-8')
}

export function incrementChatUsage(): UsageSnapshot {
  const usage = loadUsage()
  const next = { ...usage, chatCount: usage.chatCount + 1 }
  saveUsage(next)
  return next
}

export function incrementGenerationUsage(): UsageSnapshot {
  const usage = loadUsage()
  const next = { ...usage, generationCount: usage.generationCount + 1 }
  saveUsage(next)
  return next
}

export function clearUsage(): void {
  const filePath = getUsagePath()
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}
