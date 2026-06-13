import { app, nativeImage, type NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

/** Tab / window icons (full-bleed favicon set). */
const RUNTIME_ICON_FILES = ['favicon-48.png', 'favicon-32.png'] as const

function tryLoadNativeImage(candidates: string[]): NativeImage | undefined {
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue
    try {
      const icon = nativeImage.createFromPath(candidate)
      if (!icon.isEmpty()) return icon
    } catch (error) {
      console.warn(`[petory] skipped invalid icon ${candidate}:`, error)
    }
  }
  return undefined
}

/** Repo root — dev main may live under out/main or electron/main; cwd is a safe fallback. */
function projectRoot(): string {
  const candidates = [path.join(__dirname, '../..'), process.cwd()]
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, 'package.json'))) return root
  }
  return candidates[0]
}

/**
 * macOS Dock — PNG only. Electron's createFromPath() returns empty for .icns here;
 * packaged apps get their bundle icon from electron-builder, but dev relies on setIcon().
 */
export function loadDockIcon(): NativeImage | undefined {
  if (process.platform !== 'darwin') return undefined

  const root = projectRoot()
  return tryLoadNativeImage([
    path.join(root, 'build/dock-icon.png'),
    path.join(root, 'src/renderer/public/apple-touch-icon.png'),
    path.join(root, 'brand/generated/dock-icon.png')
  ])
}

/** Window / task switcher — full-bleed favicons (not Dock safe-zone assets). */
export function loadWindowIcon(): NativeImage | undefined {
  const root = projectRoot()
  const dirs = [
    path.join(root, 'src/renderer/public'),
    path.join(__dirname, '../renderer'),
    path.join(app.getAppPath(), 'out/renderer')
  ]

  for (const dir of dirs) {
    for (const file of RUNTIME_ICON_FILES) {
      const icon = tryLoadNativeImage([path.join(dir, file)])
      if (icon) return icon
    }
  }

  return tryLoadNativeImage([path.join(root, 'build/icon.png')])
}

/** @deprecated Prefer loadDockIcon / loadWindowIcon for explicit surfaces. */
export function loadAppIcon(): NativeImage | undefined {
  return process.platform === 'darwin' ? loadDockIcon() : loadWindowIcon()
}

export function resolveAppIconPath(): string | undefined {
  const root = projectRoot()
  if (process.platform === 'darwin') {
    for (const rel of [
      'build/dock-icon.png',
      'src/renderer/public/apple-touch-icon.png',
      'brand/generated/dock-icon.png'
    ]) {
      const candidate = path.join(root, rel)
      if (fs.existsSync(candidate)) return candidate
    }
    return undefined
  }

  for (const dir of [
    path.join(root, 'src/renderer/public'),
    path.join(__dirname, '../renderer'),
    path.join(app.getAppPath(), 'out/renderer')
  ]) {
    for (const file of RUNTIME_ICON_FILES) {
      const candidate = path.join(dir, file)
      if (fs.existsSync(candidate)) return candidate
    }
  }

  const buildFallback = path.join(root, 'build/icon.png')
  if (fs.existsSync(buildFallback)) return buildFallback
  return undefined
}
