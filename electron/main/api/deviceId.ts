import { app } from 'electron'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

const DEVICE_FILE = 'device-id.json'

function getDevicePath(): string {
  return path.join(app.getPath('userData'), DEVICE_FILE)
}

export function getLocalDeviceId(): string {
  const filePath = getDevicePath()
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { id?: string }
    if (raw.id) return raw.id
  } catch {
    // create below
  }

  const id = randomUUID()
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify({ id }, null, 2), 'utf-8')
  return id
}
