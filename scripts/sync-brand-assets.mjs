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

/** Modest zoom — trims transparent squircle corners + blue margin, not the cat. */
const APP_ICON_ZOOM = {
  16: 1.2,
  32: 1.14,
  48: 1.1,
  128: 1.08,
  180: 1.06,
  256: 1.06,
  512: 1.05,
  1024: 1.04
}

function zoomForSize(size) {
  return APP_ICON_ZOOM[size] ?? (size <= 64 ? 1.12 : size <= 256 ? 1.06 : 1.04)
}

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

/** Source PNG stores RGB=255 in transparent pixels — must not use for flatten. */
async function sampleAppIconBlue(trimmed) {
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels
      if (data[i + 3] > 128) {
        return { r: data[i], g: data[i + 1], b: data[i + 2], alpha: 255 }
      }
    }
  }
  return { r: 70, g: 150, b: 253, alpha: 255 }
}

function zoomedPipeline(trimmed, size) {
  const zoom = zoomForSize(size)
  const zoomed = Math.max(size, Math.round(size * zoom))
  const offset = Math.max(0, Math.round((zoomed - size) / 2))

  return sharp(trimmed)
    .resize(zoomed, zoomed, { fit: 'cover', position: 'centre' })
    .extract({ left: offset, top: offset, width: size, height: size })
}

/** Dock / installer / runtime: keep squircle alpha (transparent outer corners). */
async function writeAppIconAlpha(trimmed, dest, size) {
  await zoomedPipeline(trimmed, size).png().toFile(dest)
}

/** Browser tab favicons: solid blue tile for legibility at 16–48px. */
async function writeFaviconSolid(trimmed, dest, size, background) {
  await zoomedPipeline(trimmed, size).flatten({ background }).png().toFile(dest)
}

async function writeFaviconSet(trimmed, background, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const size of [16, 32, 48]) {
    const dest = path.join(outDir, `favicon-${size}.png`)
    await writeFaviconSolid(trimmed, dest, size, background)
    console.log(`✓ ${path.relative(root, dest)}`)
  }
  const appleTouch = path.join(outDir, 'apple-touch-icon.png')
  await writeAppIconAlpha(trimmed, appleTouch, 180)
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
const appIconBlue = await sampleAppIconBlue(appIconTrimmed)

await writeFaviconSet(appIconTrimmed, appIconBlue, path.join(root, 'website'))
await writeFaviconSet(appIconTrimmed, appIconBlue, path.join(root, 'src/renderer/public'))
await writeFaviconSet(appIconTrimmed, appIconBlue, path.join(root, 'server/admin/public'))

const buildDir = path.join(root, 'build')
fs.mkdirSync(buildDir, { recursive: true })

const iconPng = path.join(buildDir, 'icon.png')
await writeAppIconAlpha(appIconTrimmed, iconPng, 1024)
console.log('✓ build/icon.png')

const iconset = path.join(buildDir, 'icon.iconset')
if (fs.existsSync(iconset)) {
  fs.rmSync(iconset, { recursive: true, force: true })
}
fs.mkdirSync(iconset, { recursive: true })

for (const size of [16, 32, 128, 256, 512]) {
  const out1 = path.join(iconset, `icon_${size}x${size}.png`)
  const out2 = path.join(iconset, `icon_${size}x${size}@2x.png`)
  await writeAppIconAlpha(appIconTrimmed, out1, size)
  await writeAppIconAlpha(appIconTrimmed, out2, size * 2)
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
