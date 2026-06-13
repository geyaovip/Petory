import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const iconPath = path.join(root, 'brand/generated/icon.png')
const fallbackIcon = path.join(root, 'build/icon.png')
const dest = path.join(root, 'website/assets/og-share.png')

const source = fs.existsSync(iconPath) ? iconPath : fallbackIcon
if (!fs.existsSync(source)) {
  console.warn('[petory] skip og-share — icon.png not found (run npm run sync:brand)')
  process.exit(0)
}

const width = 1200
const height = 630
const iconSize = 420

const icon = await sharp(source)
  .resize(iconSize, iconSize, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toBuffer()

fs.mkdirSync(path.dirname(dest), { recursive: true })
await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 61, g: 127, b: 214, alpha: 1 }
  }
})
  .composite([
    {
      input: icon,
      top: Math.round((height - iconSize) / 2),
      left: Math.round((width - iconSize) / 2)
    }
  ])
  .png()
  .toFile(dest)

console.log(`✓ ${path.relative(root, dest)}`)
