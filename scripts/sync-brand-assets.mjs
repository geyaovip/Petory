import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'petory_logo')

/** Single source of truth — do not add duplicate packs under resources/. */
const sources = {
  wordmark: '01_petory_primary_logo_transparent.png',
  appIcon: '03_petory_app_icon_transparent.png'
}

const TRIM_THRESHOLD = 12
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

/** Remove transparent padding only — never crop visible artwork. */
async function writeTrimmedPng(fromName, toPath) {
  const from = path.join(srcDir, fromName)
  const to = path.join(root, toPath)
  if (!fs.existsSync(from)) {
    throw new Error(`Missing source asset: ${from}`)
  }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  await sharp(from).trim({ threshold: TRIM_THRESHOLD }).png().toFile(to)
  console.log(`✓ ${toPath}`)
}

async function trimmedAppIconBuffer() {
  return sharp(path.join(srcDir, sources.appIcon))
    .trim({ threshold: TRIM_THRESHOLD })
    .png()
    .toBuffer()
}

/** Trim transparent margins, then scale to fit — no zoom/crop. Shared by favicon + build icons. */
async function writeSquareIcon(trimmed, dest, size) {
  await sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toFile(dest)
}

async function writeFaviconSet(trimmed, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const size of [16, 32, 48]) {
    const dest = path.join(outDir, `favicon-${size}.png`)
    await writeSquareIcon(trimmed, dest, size)
    console.log(`✓ ${path.relative(root, dest)}`)
  }
  const appleTouch = path.join(outDir, 'apple-touch-icon.png')
  await writeSquareIcon(trimmed, appleTouch, 180)
  console.log(`✓ ${path.relative(root, appleTouch)}`)
  await fs.promises.copyFile(path.join(outDir, 'favicon-32.png'), path.join(outDir, 'favicon.png'))
  console.log(`✓ ${path.relative(root, path.join(outDir, 'favicon.png'))}`)
}

for (const file of Object.values(sources)) {
  const full = path.join(srcDir, file)
  if (!fs.existsSync(full)) {
    console.error(`✗ Expected ${full}`)
    process.exit(1)
  }
}

const wordmarkTargets = [
  'website/assets/logo.png',
  'src/renderer/public/logo.png',
  'server/admin/public/logo.png'
]
for (const target of wordmarkTargets) {
  await writeTrimmedPng(sources.wordmark, target)
}

const appIconTrimmed = await trimmedAppIconBuffer()

await writeFaviconSet(appIconTrimmed, path.join(root, 'website'))
await writeFaviconSet(appIconTrimmed, path.join(root, 'src/renderer/public'))
await writeFaviconSet(appIconTrimmed, path.join(root, 'server/admin/public'))

const buildDir = path.join(root, 'build')
fs.mkdirSync(buildDir, { recursive: true })

const iconPng = path.join(buildDir, 'icon.png')
await writeSquareIcon(appIconTrimmed, iconPng, 1024)
console.log('✓ build/icon.png')

const iconset = path.join(buildDir, 'icon.iconset')
if (fs.existsSync(iconset)) {
  fs.rmSync(iconset, { recursive: true, force: true })
}
fs.mkdirSync(iconset, { recursive: true })

for (const size of [16, 32, 128, 256, 512]) {
  const out1 = path.join(iconset, `icon_${size}x${size}.png`)
  const out2 = path.join(iconset, `icon_${size}x${size}@2x.png`)
  await writeSquareIcon(appIconTrimmed, out1, size)
  await writeSquareIcon(appIconTrimmed, out2, size * 2)
}

try {
  execSync(`iconutil -c icns "${iconset}" -o "${path.join(buildDir, 'icon.icns')}"`, {
    stdio: 'inherit'
  })
  console.log('✓ build/icon.icns')
} catch {
  console.warn('⚠ iconutil failed — build/icon.png is still available for electron-builder')
}

console.log('Brand assets synced from petory_logo/')
