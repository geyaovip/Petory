import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { loadUserSettings } from './settingsStore'

const MAX_REPORTS = 20

interface CrashReport {
  id: string
  at: string
  source: 'main' | 'renderer'
  message: string
  stack?: string
  version: string
}

function getReportsDir(): string {
  return path.join(app.getPath('userData'), 'crash-reports')
}

function isEnabled(): boolean {
  return loadUserSettings().enableCrashReporting
}

function writeReport(report: CrashReport): void {
  if (!isEnabled()) return

  const dir = getReportsDir()
  fs.mkdirSync(dir, { recursive: true })
  const fileName = `${report.at.replace(/[:.]/g, '-')}-${report.source}.json`
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(report, null, 2), 'utf-8')

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  while (files.length > MAX_REPORTS) {
    const oldest = files.shift()
    if (oldest) fs.unlinkSync(path.join(dir, oldest))
  }
}

export function recordCrash(
  source: CrashReport['source'],
  error: unknown,
  extra?: string
): void {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined

  writeReport({
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    source,
    message: extra ? `${message} — ${extra}` : message,
    stack,
    version: app.getVersion()
  })
}

export function initCrashReporter(): void {
  process.on('uncaughtException', (error) => {
    recordCrash('main', error)
    console.error('[petory] uncaughtException:', error)
  })

  process.on('unhandledRejection', (reason) => {
    recordCrash('main', reason)
    console.error('[petory] unhandledRejection:', reason)
  })
}

export function listCrashReports(): CrashReport[] {
  const dir = getReportsDir()
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, MAX_REPORTS)
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')) as CrashReport)
}
