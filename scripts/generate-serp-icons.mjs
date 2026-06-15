/** Website/admin browser icons and opaque search/organization icons. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const websiteDir = path.join(root, 'website')
const adminDir = path.join(root, 'server', 'admin', 'public')
const browserIconDir = path.join(root, 'brand', 'generated')

const sources = [
  path.join(root, 'brand/generated/icon.png'),
  path.join(root, 'build/icon.png')
]

const source = sources.find((candidate) => fs.existsSync(candidate))
if (!source) {
  console.warn('[petory] skip serp icons — icon.png not found (run npm run sync:brand)')
  process.exit(0)
}

/** Opaque blue — matches og-share; avoids transparent corners in Google SERP. */
const SERP_BG = { r: 61, g: 127, b: 214, alpha: 255 }

async function writeOpaqueIcon(size, dest, inset = 0.84) {
  const inner = Math.max(1, Math.round(size * inset))
  const pad = Math.floor((size - inner) / 2)

  const icon = await sharp(source)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SERP_BG
    }
  })
    .composite([{ input: icon, top: pad, left: pad }])
    .flatten({ background: SERP_BG })
    .png()
    .toFile(dest)
}

fs.mkdirSync(websiteDir, { recursive: true })

// Browser tabs need transparent rounded corners. Do not place an already-blue
// rounded tile on another opaque blue square.
for (const size of [16, 32, 48]) {
  await fs.promises.copyFile(
    path.join(browserIconDir, `favicon-${size}.png`),
    path.join(websiteDir, `favicon-${size}.png`)
  )
}
await fs.promises.copyFile(path.join(websiteDir, 'favicon-32.png'), path.join(websiteDir, 'favicon.png'))
await fs.promises.copyFile(path.join(websiteDir, 'favicon-48.png'), path.join(websiteDir, 'favicon.ico'))

// Larger opaque assets are only for search/organization metadata.
await writeOpaqueIcon(96, path.join(websiteDir, 'site-icon-96.png'))
await writeOpaqueIcon(192, path.join(websiteDir, 'site-icon-192.png'))

fs.mkdirSync(adminDir, { recursive: true })
for (const name of ['favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'favicon.png']) {
  await fs.promises.copyFile(path.join(websiteDir, name), path.join(adminDir, name))
}

console.log('✓ website/favicon-* (transparent browser-tab set)')
console.log('✓ website/site-icon-192.png (Organization logo)')
console.log('✓ server/admin/public/favicon-*.png (matches website)')
