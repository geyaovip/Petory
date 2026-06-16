#!/usr/bin/env node
/**
 * One-command production deploy over SSH.
 * Merges secrets locally, syncs .env, pulls code, rebuilds API, verifies health.
 *
 * Usage:
 *   npm run deploy:server
 *   npm run deploy:server -- --env-only   # only sync deploy/server/.env
 *   npm run deploy:server -- --skip-env   # pull + rebuild without touching .env
 *
 * Env:
 *   PETORY_DEPLOY_HOST  default ubuntu@165.154.203.52
 *   PETORY_DEPLOY_PATH  default /home/ubuntu/apps/petory/current
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const host = process.env.PETORY_DEPLOY_HOST || 'ubuntu@165.154.203.52'
const remotePath = process.env.PETORY_DEPLOY_PATH || '/home/ubuntu/apps/petory/current'
const remoteEnv = `${remotePath}/deploy/server/.env`
const composeFile = 'deploy/server/compose.yaml'
const args = process.argv.slice(2)
const envOnly = args.includes('--env-only')
const skipEnv = args.includes('--skip-env')

function run(command, runArgs, options = {}) {
  const result = spawnSync(command, runArgs, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    shell: false,
    env: process.env
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function ssh(command) {
  run('ssh', [host, command])
}

function step(label) {
  console.log(`\n→ ${label}`)
}

step('Merge deploy/server/.env from server/.env')
run('node', ['scripts/merge-deploy-env.mjs'])

if (!skipEnv) {
  step(`Upload ${remoteEnv}`)
  run('scp', [path.join(root, 'deploy/server/.env'), `${host}:${remoteEnv}`])
}

if (envOnly) {
  step('Recreate API container (reload .env)')
  ssh(`cd ${remotePath} && docker compose -f ${composeFile} up -d api`)
  console.log('\n✓ Env synced and API restarted')
  process.exit(0)
}

step(`Pull latest code on ${host}`)
ssh(`cd ${remotePath} && git pull --ff-only`)

step('Rebuild API container')
ssh(`cd ${remotePath} && docker compose -f ${composeFile} up -d --build api`)

step('Apply database schema')
ssh(`cd ${remotePath} && docker compose -f ${composeFile} exec -T api npx prisma db push`)

step('Verify health')
const health = spawnSync(
  'ssh',
  [host, `curl -sf http://127.0.0.1:8787/health`],
  { encoding: 'utf-8' }
)
if (health.status !== 0) {
  console.error('✗ Local health check failed on VPS')
  process.exit(1)
}

let parsed
try {
  parsed = JSON.parse(health.stdout.trim())
} catch {
  console.error('✗ Unexpected health response:', health.stdout)
  process.exit(1)
}

console.log(`✓ VPS health: ok=${parsed.ok}, version=${parsed.version}, imageApi=${parsed.imageApi}`)
if (parsed.imageApi !== true) {
  console.warn('⚠ imageApi is false — check ARK_API_KEY in deploy/server/.env')
  process.exit(1)
}

const publicHealth = spawnSync('curl', ['-sf', 'https://api.petory.chat/health'], { encoding: 'utf-8' })
if (publicHealth.status === 0) {
  try {
    const pub = JSON.parse(publicHealth.stdout.trim())
    console.log(`✓ Public health: ok=${pub.ok}, version=${pub.version}, imageApi=${pub.imageApi}`)
  } catch {
    console.log('✓ Public endpoint reachable')
  }
}

console.log('\nDeploy complete.')
