#!/usr/bin/env node
/**
 * Start PostgreSQL + API server + Electron client for local integration testing.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { postgresFailureHint, waitForPostgres } from './lib/wait-postgres.mjs'
import { stopDevProcesses } from './lib/dev-runtime.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = path.join(root, 'server')

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd ?? root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...options.env }
  })
}

function runSyncNpm(args, cwd) {
  const result = spawnSync('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed (exit ${result.status ?? 'unknown'})`)
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureServerDeps() {
  const prismaBin = path.join(serverDir, 'node_modules', '.bin', 'prisma')
  if (fs.existsSync(prismaBin)) return

  console.info('[petory] server dependencies missing — running npm install in server/...')
  runSyncNpm(['install'], serverDir)

  if (!fs.existsSync(prismaBin)) {
    throw new Error('prisma still not found after npm install — check server/package.json')
  }
}

function ensureServerEnv() {
  const envPath = path.join(serverDir, '.env')
  if (!fs.existsSync(envPath)) {
    const example = path.join(serverDir, '.env.example')
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, envPath)
      console.warn('[petory] created server/.env from .env.example — add MINIMAX_API_KEY / KIMI_API_KEY')
    } else {
      console.warn('[petory] server/.env missing — copy server/.env.example manually')
    }
  }
}

function isPostgresContainerRunning() {
  const result = spawnSync(
    'docker',
    ['inspect', '-f', '{{.State.Running}}', 'petory-postgres'],
    { encoding: 'utf8' }
  )
  return result.status === 0 && result.stdout.trim() === 'true'
}

async function ensurePostgres() {
  if (isPostgresContainerRunning()) {
    console.info('[petory] Postgres container already running — skip db:up')
    return
  }

  console.info('[petory] starting PostgreSQL (Docker)...')
  const dbUp = run('npm', ['run', 'db:up'], { cwd: serverDir })
  await new Promise((resolve, reject) => {
    dbUp.on('exit', (code) => {
      if (code === 0) return resolve()
      if (isPostgresContainerRunning()) {
        console.warn('[petory] db:up failed but petory-postgres is running — continuing')
        return resolve()
      }
      reject(
        new Error(
          `db:up failed (${code}). Port 5432 may be in use — run: docker ps | grep 5432`
        )
      )
    })
  })
}

async function main() {
  ensureServerDeps()
  ensureServerEnv()

  await ensurePostgres()

  console.info('[petory] waiting for Postgres on localhost:5433 (up to ~60s)...')
  const pgReady = await waitForPostgres()
  if (!pgReady) {
    console.error('[petory] Postgres not ready.\n  ' + postgresFailureHint())
    process.exit(1)
  }

  console.info('[petory] pushing Prisma schema...')
  runSyncNpm(['run', 'db:push'], serverDir)

  console.info('[petory] starting API server...')
  const server = run('npm', ['run', 'dev'], { cwd: serverDir })

  await wait(2000)

  console.info('[petory] stopping stale Electron dev processes...')
  stopDevProcesses(root)

  console.info('[petory] starting Electron client (API: http://localhost:8787)...')
  const client = run('npm', ['run', 'dev'], { cwd: root })

  const shutdown = () => {
    server.kill('SIGINT')
    client.kill('SIGINT')
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  client.on('exit', (code) => {
    server.kill('SIGINT')
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error('[petory] dev stack failed:', error.message)
  process.exit(1)
})
