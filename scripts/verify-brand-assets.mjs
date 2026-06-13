import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function pixelFlags(r, g, b, a) {
  const light = (r + g + b) / 3
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return { light, sat, a, isWhiteFur: light > 200 && sat < 40 && a > 200 }
}

async function analyzeDockIcon(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const errors = []

  let whiteFur = 0
  for (let y = Math.floor(height * 0.34); y < Math.floor(height * 0.56); y++) {
    for (let x = Math.floor(width * 0.38); x < Math.floor(width * 0.62); x++) {
      const i = (y * width + x) * channels
      if (pixelFlags(data[i], data[i + 1], data[i + 2], data[i + 3]).isWhiteFur) whiteFur++
    }
  }
  if (whiteFur < 80) {
    errors.push(`猫脸/胸口白色区域过少（${whiteFur} px，期望 ≥80）— 可能被误清透明`)
  }

  let leftPale = 0
  let bottomPale = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const { light, sat, a } = pixelFlags(data[i], data[i + 1], data[i + 2], data[i + 3])
      if (a > 10) {
        if (light >= 175 && sat < 58) leftPale++
        break
      }
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = height - 1; y >= 0; y--) {
      const i = (y * width + x) * channels
      const { light, sat, a } = pixelFlags(data[i], data[i + 1], data[i + 2], data[i + 3])
      if (a > 10) {
        if (light >= 175 && sat < 58) bottomPale++
        break
      }
    }
  }
  if (leftPale > 0) errors.push(`Dock 图标左边仍有 ${leftPale} 处浅色白边像素`)
  if (bottomPale > 0) errors.push(`Dock 图标底边仍有 ${bottomPale} 处浅色白边像素`)

  return errors
}

export async function verifyBrandAssets(baseRoot = root) {
  const dockIcon = path.join(baseRoot, 'build/dock-icon.png')
  const errors = []

  if (!fs.existsSync(dockIcon)) {
    errors.push('缺少 build/dock-icon.png — 请先运行 npm run sync:brand')
    return { ok: false, errors }
  }

  const meta = await sharp(dockIcon).metadata()
  if (meta.width !== 512 || meta.height !== 512) {
    errors.push(`dock-icon 应为 512×512，当前 ${meta.width}×${meta.height}`)
  }

  errors.push(...(await analyzeDockIcon(dockIcon)))
  return { ok: errors.length === 0, errors }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  const result = await verifyBrandAssets()
  if (!result.ok) {
    console.error('✗ Brand asset verification failed:')
    for (const err of result.errors) console.error(`  - ${err}`)
    process.exit(1)
  }
  console.log('✓ Brand assets verified (cat face + Dock edges)')
}
