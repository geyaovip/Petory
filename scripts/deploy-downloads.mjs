#!/usr/bin/env node
/**
 * Mirror release installers to VPS downloads directory.
 *
 * Usage:
 *   npm run deploy:downloads
 *   npm run deploy:downloads -- --from-github   # download v{package.json version} from GitHub Release
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const host = process.env.PETORY_DEPLOY_HOST || 'ubuntu@165.154.203.52'
const remoteDir = process.env.PETORY_DEPLOY_DOWNLOADS || '/home/ubuntu/apps/petory/current/deploy/server/downloads'
const fromGithub = process.argv.includes('--from-github')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
const version = pkg.version
const releaseDir = path.join(root, 'release')

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function collectLocalArtifacts() {
  if (!fs.existsSync(releaseDir)) return []
  return fs
    .readdirSync(releaseDir)
    .filter((name) => /^Petory-.*\.(dmg|exe)$/.test(name))
    .map((name) => path.join(releaseDir, name))
}

let files = collectLocalArtifacts()
if (files.length === 0 || fromGithub) {
  console.log(`Fetching release artifacts for v${version} from GitHub…`)
  run('node', ['scripts/download-release-installers.mjs', `v${version}`, releaseDir])
  files = collectLocalArtifacts()
}

if (files.length === 0) {
  console.error('✗ No .dmg/.exe files found in release/')
  process.exit(1)
}

console.log(`\n→ Upload ${files.length} file(s) to ${host}:${remoteDir}`)
run('ssh', [host, `mkdir -p ${remoteDir}`])
for (const file of files) {
  run('scp', [file, `${host}:${remoteDir}/`])
  console.log(`✓ ${path.basename(file)}`)
}

console.log('\nDownloads mirrored. Verify:')
console.log(`  curl -sI https://api.petory.chat/downloads/${path.basename(files[0])}`)
