import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const releaseDir = path.join(root, 'release')
const outDir = path.join(root, 'website/releases')

if (!fs.existsSync(releaseDir)) {
  console.warn('No release/ directory — run npm run pack first.')
  process.exit(0)
}

fs.mkdirSync(outDir, { recursive: true })
let copied = 0

for (const file of fs.readdirSync(releaseDir)) {
  if (file.startsWith('latest') && file.endsWith('.yml')) {
    fs.copyFileSync(path.join(releaseDir, file), path.join(outDir, file))
    console.log(`Copied ${file} → website/releases/`)
    copied++
  }
}

if (copied === 0) {
  console.warn('No latest*.yml found in release/. Pack the app first.')
}
