import { app, nativeImage, type NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

/** Tab / window icons (full-bleed favicon set). */
const RUNTIME_ICON_FILES = ['favicon-48.png', 'favicon-32.png'] as const

/** Repo root from compiled main (out/main → ../..). */
function projectRoot(): string {
  return path.join(__dirname, '../..')
}

/**
 * macOS Dock icon — must use macInstaller assets (84% inset), not stale out/renderer copies.
 * Priority: build/icon.icns → src/renderer/public/apple-touch-icon.png (sync:brand mac Dock).
 */
function resolveMacDockIconPath(): string | undefined {
  const root = projectRoot()
  const candidates = [
    path.join(root, 'build/icon.icns'),
    path.join(root, 'src/renderer/public/apple-touch-icon.png')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return undefined
}

/** Window / non-Dock fallback — favicons from renderer public or build output. */
export function resolveAppIconPath(): string | undefined {
  if (process.platform === 'darwin') {
    const dockIcon = resolveMacDockIconPath()
    if (dockIcon) return dockIcon
  }

  const root = projectRoot()
  const roots = [
    path.join(root, 'src/renderer/public'),
    path.join(__dirname, '../renderer'),
    path.join(app.getAppPath(), 'out/renderer')
  ]

  for (const dir of roots) {
    for (const file of RUNTIME_ICON_FILES) {
      const candidate = path.join(dir, file)
      if (fs.existsSync(candidate)) return candidate
    }
  }

  const buildFallback = path.join(root, 'build/icon.png')
  if (fs.existsSync(buildFallback)) return buildFallback
  return undefined
}

export function loadAppIcon(): NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) return undefined
  const icon = nativeImage.createFromPath(iconPath)
  return icon.isEmpty() ? undefined : icon
}
