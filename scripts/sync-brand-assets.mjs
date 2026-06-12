import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'petory_logo')

const sources = {
  primary: '01_petory_primary_logo_transparent.png',
  appIcon: '03_petory_app_icon_transparent.png',
  avatar: '05_petory_social_avatar_transparent.png'
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

for (const file of Object.values(sources)) {
  const full = path.join(srcDir, file)
  if (!fs.existsSync(full)) {
    console.error(`✗ Expected ${full}`)
    process.exit(1)
  }
}

await writeTrimmedPng(sources.primary, 'website/assets/logo.png')
await writeTrimmedPng(sources.primary, 'src/renderer/public/logo.png')
await writeTrimmedPng(sources.primary, 'server/admin/public/logo.png')
await writeTrimmedPng(sources.appIcon, 'server/admin/public/app-icon.png')
await writeTrimmedPng(sources.appIcon, 'website/assets/app-icon.png')
await writeTrimmedPng(sources.appIcon, 'src/renderer/public/app-icon.png')
await writeTrimmedPng(sources.avatar, 'website/assets/avatar.png')

/** Trim transparent margins, then scale to fit — no zoom/crop. */
async function writeFavicon(source, dest, size) {
  const trimmed = await sharp(source).trim({ threshold: TRIM_THRESHOLD }).png().toBuffer()
  await sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toFile(dest)
}

async function writeFaviconSet(source, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  for (const size of [16, 32, 48]) {
    const dest = path.join(outDir, `favicon-${size}.png`)
    await writeFavicon(source, dest, size)
    console.log(`✓ ${path.relative(root, dest)}`)
  }
  const appleTouch = path.join(outDir, 'apple-touch-icon.png')
  await writeFavicon(source, appleTouch, 180)
  console.log(`✓ ${path.relative(root, appleTouch)}`)
  await fs.promises.copyFile(path.join(outDir, 'favicon-32.png'), path.join(outDir, 'favicon.png'))
  console.log(`✓ ${path.relative(root, path.join(outDir, 'favicon.png'))}`)
}

const appIconSrc = path.join(srcDir, sources.appIcon)
await writeFaviconSet(appIconSrc, path.join(root, 'website'))
await writeFaviconSet(appIconSrc, path.join(root, 'src/renderer/public'))
await writeFaviconSet(appIconSrc, path.join(root, 'server/admin/public'))

const buildDir = path.join(root, 'build')
fs.mkdirSync(buildDir, { recursive: true })
const iconPng = path.join(buildDir, 'icon.png')
await sharp(path.join(srcDir, sources.appIcon))
  .trim({ threshold: TRIM_THRESHOLD })
  .resize(1024, 1024, { fit: 'contain', background: TRANSPARENT })
  .png()
  .toFile(iconPng)
console.log('✓ build/icon.png')

const iconset = path.join(buildDir, 'icon.iconset')
if (fs.existsSync(iconset)) {
  fs.rmSync(iconset, { recursive: true, force: true })
}
fs.mkdirSync(iconset, { recursive: true })

for (const size of [16, 32, 128, 256, 512]) {
  const out1 = path.join(iconset, `icon_${size}x${size}.png`)
  const out2 = path.join(iconset, `icon_${size}x${size}@2x.png`)
  execSync(`sips -z ${size} ${size} "${iconPng}" --out "${out1}"`, { stdio: 'inherit' })
  execSync(`sips -z ${size * 2} ${size * 2} "${iconPng}" --out "${out2}"`, { stdio: 'inherit' })
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
