import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'build/dock-icon.png',
  'build/icon.png',
  'brand/generated/logo.png',
  'brand/generated/favicon-32.png'
]

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)))
if (missing.length === 0) {
  process.exit(0)
}

console.info('[petory] brand assets missing — running sync:brand …')
console.info(`  missing: ${missing.join(', ')}`)
execSync('node scripts/sync-brand-assets.mjs', { cwd: root, stdio: 'inherit' })
