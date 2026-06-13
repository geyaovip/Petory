import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

export function petoryUserDataDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Application Support/petory')
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'petory')
  }
  return path.join(os.homedir(), '.config/petory')
}

export function clearSingletonLocks(userDataDir = petoryUserDataDir()) {
  for (const name of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    const target = path.join(userDataDir, name)
    if (!fs.existsSync(target)) continue
    try {
      fs.unlinkSync(target)
    } catch {
      // busy symlink or permission — dev-stop may retry
    }
  }
}

function pkill(pattern) {
  try {
    execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' })
  } catch {
    // no matching process
  }
}

function killPort(port) {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim()
    if (!output) return
    for (const pid of output.split(/\s+/)) {
      if (!pid) continue
      try {
        process.kill(Number(pid), 'SIGTERM')
      } catch {
        // already exited
      }
    }
  } catch {
    // lsof not found or nothing listening
  }
}

function sleep(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    // brief pause so SIGTERM can finish before clearing singleton locks
  }
}

/** Stop electron-vite + Electron dev instances and clear stale singleton locks. */
export function stopDevProcesses(root = process.cwd()) {
  pkill(path.join(root, 'node_modules/.bin/electron-vite'))
  pkill(path.join(root, 'node_modules/electron-vite/bin/electron-vite.js'))
  pkill('electron-vite dev')
  pkill(path.join(root, 'node_modules/electron/dist/Electron.app'))
  killPort(5173)
  sleep(400)
  clearSingletonLocks()
}
