import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { LEGAL_VERSION } from '../../src/shared/legal'
import type { LegalAcceptance } from '../../src/shared/types/legal'

const LEGAL_FILE = 'legal-acceptance.json'

function getLegalPath(): string {
  return path.join(app.getPath('userData'), LEGAL_FILE)
}

export function loadLegalAcceptance(): LegalAcceptance | null {
  try {
    const raw = JSON.parse(fs.readFileSync(getLegalPath(), 'utf-8')) as LegalAcceptance
    if (raw.version !== LEGAL_VERSION) return null
    return raw
  } catch {
    return null
  }
}

export function hasAcceptedLegal(): boolean {
  return loadLegalAcceptance() !== null
}

export function clearLegalAcceptance(): void {
  const filePath = getLegalPath()
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

export function saveLegalAcceptance(): LegalAcceptance {
  const record: LegalAcceptance = {
    version: LEGAL_VERSION,
    acceptedAt: new Date().toISOString()
  }
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getLegalPath(), JSON.stringify(record, null, 2), 'utf-8')
  return record
}
