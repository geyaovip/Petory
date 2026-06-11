import net from 'node:net'
import { spawnSync } from 'node:child_process'

export function inspectContainer(name, format) {
  return spawnSync('docker', ['inspect', '-f', format, name], { encoding: 'utf8' })
}

export function isPostgresContainerRunning(name = 'petory-postgres') {
  const result = inspectContainer(name, '{{.State.Running}}')
  return result.status === 0 && result.stdout.trim() === 'true'
}

export function postgresContainerStatus(name = 'petory-postgres') {
  const running = inspectContainer(name, '{{.State.Running}}')
  if (running.status !== 0) return 'missing'
  if (running.stdout.trim() !== 'true') {
    const exitCode = inspectContainer(name, '{{.State.ExitCode}}')
    return `stopped (exit ${exitCode.stdout?.trim() || '?'})`
  }
  const health = inspectContainer(name, '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}')
  return health.stdout?.trim() || 'running'
}

function probeTcp(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs })
    const done = (ok) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(ok)
    }
    socket.on('connect', () => done(true))
    socket.on('timeout', () => done(false))
    socket.on('error', () => done(false))
  })
}

export async function waitForPostgres({
  host = 'localhost',
  port = 5433,
  containerName = 'petory-postgres',
  attempts = 60,
  intervalMs = 1000
} = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const status = postgresContainerStatus(containerName)
    if (status === 'healthy' || (status === 'running' && (await probeTcp(host, port)))) {
      return true
    }
    if (status === 'none' && (await probeTcp(host, port))) {
      return true
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

export function postgresFailureHint(containerName = 'petory-postgres') {
  const status = postgresContainerStatus(containerName)
  if (status === 'missing') {
    return [
      'petory-postgres container not found.',
      'Run: docker compose up -d postgres',
      'Then: docker compose logs postgres'
    ].join('\n  ')
  }
  if (status.startsWith('stopped')) {
    return [
      `petory-postgres is ${status}.`,
      'Run: docker compose up -d postgres',
      'Then: docker compose logs postgres'
    ].join('\n  ')
  }
  return [
    'Postgres is not accepting connections on localhost:5433 yet.',
    'Run: docker compose logs postgres',
    'Ensure Docker Desktop is running and port 5433 is free.'
  ].join('\n  ')
}
