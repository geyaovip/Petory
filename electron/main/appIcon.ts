import { nativeImage, type NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

export function loadAppIcon(): NativeImage | undefined {
  const iconPath = path.join(__dirname, '../../build/icon.png')
  if (!fs.existsSync(iconPath)) return undefined
  const icon = nativeImage.createFromPath(iconPath)
  return icon.isEmpty() ? undefined : icon
}
