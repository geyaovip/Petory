import { app, nativeImage, type NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

/** Same raster as renderer favicon (apple-touch-icon / favicon-48), not the login wordmark. */
const RUNTIME_ICON_FILES = ['apple-touch-icon.png', 'favicon-48.png'] as const

export function resolveAppIconPath(): string | undefined {
  const roots = [
    path.join(__dirname, '../renderer'),
    path.join(app.getAppPath(), 'out/renderer')
  ]

  for (const root of roots) {
    for (const file of RUNTIME_ICON_FILES) {
      const candidate = path.join(root, file)
      if (fs.existsSync(candidate)) return candidate
    }
  }

  const buildFallback = path.join(__dirname, '../../build/icon.png')
  if (fs.existsSync(buildFallback)) return buildFallback
  return undefined
}

export function loadAppIcon(): NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) return undefined
  const icon = nativeImage.createFromPath(iconPath)
  return icon.isEmpty() ? undefined : icon
}
