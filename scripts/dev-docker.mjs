#!/usr/bin/env node
/**
 * Docker: Postgres + 官网；API 在本机；Electron 客户端在本机。
 * 避免构建 api 镜像（无需拉 node:20-alpine）。
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { postgresFailureHint, waitForPostgres } from './lib/wait-postgres.mjs'

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

function runSyncNpm(args, cwd = root) {
  const result = spawnSync('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed (exit ${result.status ?? 'unknown'})`)
  }
}

function ensureServerDeps() {
  const prismaBin = path.join(serverDir, 'node_modules', '.bin', 'prisma')
  if (!fs.existsSync(prismaBin)) {
    console.info('[petory] installing server dependencies...')
    runSyncNpm(['run', 'server:install'], root)
  }
}

function ensureServerEnv() {
  const envPath = path.join(serverDir, '.env')
  if (!fs.existsSync(envPath)) {
    const example = path.join(serverDir, '.env.example')
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, envPath)
      console.warn('[petory] created server/.env — add API keys if needed')
    }
  }
}

async function waitForHealth(url, attempts = 45) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

async function ensureDockerStack() {
  console.info('[petory] Docker: postgres + website (no api image build)...')
  const compose = spawnSync('docker', ['compose', 'up', '-d', 'postgres', 'website'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (compose.status !== 0) {
    throw new Error('docker compose up failed — is Docker Desktop running?')
  }
}

async function main() {
  ensureServerDeps()
  ensureServerEnv()

  await ensureDockerStack()

  console.info('[petory] waiting for Postgres on localhost:5433 (up to ~60s)...')
  const pgReady = await waitForPostgres()
  if (!pgReady) {
    console.error('[petory] Postgres not ready.\n  ' + postgresFailureHint())
    process.exit(1)
  }

  console.info('[petory] syncing database schema...')
  runSyncNpm(['run', 'server:db'], root)

  console.info('[petory] starting API on host :8787...')
  const server = run('npm', ['run', 'server:dev'], { cwd: root })

  console.info('[petory] waiting for http://localhost:8787/health ...')
  const ok = await waitForHealth('http://localhost:8787/health')
  if (!ok) {
    server.kill('SIGINT')
    console.error('[petory] API not ready — check server/.env and postgres on :5433')
    process.exit(1)
  }

  console.info('[petory] ready:')
  console.info('  管理端  http://localhost:8787/admin/')
  console.info('  官网    http://localhost:5180/')
  console.info('[petory] starting Electron client...')
  const client = run('npm', ['run', 'dev'], { cwd: root })

  const shutdown = () => {
    client.kill('SIGINT')
    server.kill('SIGINT')
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  client.on('exit', (code) => {
    server.kill('SIGINT')
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error('[petory] dev:docker failed:', error.message)
  process.exit(1)
})
