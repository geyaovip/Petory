import { app, screen } from 'electron'
import fs from 'fs'
import path from 'path'
import type { WindowPosition } from '../../src/shared/ipc'

const FILE_NAME = 'window-state.json'

interface WindowState extends WindowPosition {
  width: number
  height: number
}

const PET_WINDOW_WIDTH = 220
const PET_WINDOW_HEIGHT = 280
const PET_WINDOW_MARGIN = 24

/** Old default before bottom-right placement — used for one-time migration. */
export const LEGACY_PET_WINDOW_POSITION = { x: 100, y: 100 }

export function getCenteredPosition(
  width: number,
  height: number
): { x: number; y: number } {
  const { width: screenW, height: screenH, x, y } = screen.getPrimaryDisplay().workArea
  return {
    x: x + Math.round((screenW - width) / 2),
    y: y + Math.round((screenH - height) / 2)
  }
}

export function getDefaultPetWindowState(): WindowState {
  const { width: screenW, height: screenH, x, y } = screen.getPrimaryDisplay().workArea
  return {
    x: x + screenW - PET_WINDOW_WIDTH - PET_WINDOW_MARGIN,
    y: y + screenH - PET_WINDOW_HEIGHT - PET_WINDOW_MARGIN,
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT
  }
}

export function isLegacyPetPosition(x: number, y: number): boolean {
  return (
    Math.abs(x - LEGACY_PET_WINDOW_POSITION.x) <= 8 &&
    Math.abs(y - LEGACY_PET_WINDOW_POSITION.y) <= 8
  )
}

function getStorePath(): string {
  return path.join(app.getPath('userData'), FILE_NAME)
}

export function loadWindowState(): WindowState {
  const defaults = getDefaultPetWindowState()
  try {
    const raw = fs.readFileSync(getStorePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<WindowState>
    const merged = { ...defaults, ...parsed }
    if (isLegacyPetPosition(merged.x, merged.y)) {
      const migrated = { ...merged, x: defaults.x, y: defaults.y }
      saveWindowState(migrated)
      return migrated
    }
    return merged
  } catch {
    return defaults
  }
}

export function saveWindowState(state: WindowState): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getStorePath(), JSON.stringify(state, null, 2), 'utf-8')
}
