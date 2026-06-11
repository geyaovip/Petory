import { spawn, spawnSync } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

function resolvePython(): string {
  const configured = process.env['PETORY_PYTHON']?.trim()
  if (configured) return configured
  if (process.platform === 'darwin') return '/usr/bin/python3'
  return 'python3'
}

function buildPythonEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
  }
  const userSite = spawnSync(resolvePython(), ['-m', 'site', '--user-site'], {
    encoding: 'utf8',
    env
  })
  if (userSite.status === 0) {
    const site = userSite.stdout.trim()
    if (site) {
      env.PYTHONPATH = [process.env.PYTHONPATH, site].filter(Boolean).join(path.delimiter)
    }
  }
  return env
}

function getScriptPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'scripts/rembg_remove.py')
  }
  const candidates = [
    path.join(app.getAppPath(), 'scripts/rembg_remove.py'),
    path.join(process.cwd(), 'scripts/rembg_remove.py')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return candidates[0]
}

export async function removeBackground(inputPath: string, outputPath: string): Promise<void> {
  const scriptPath = getScriptPath()
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`rembg script not found: ${scriptPath}`)
  }

  const python = resolvePython()
  const env = buildPythonEnv()

  await new Promise<void>((resolve, reject) => {
    const child = spawn(python, [scriptPath, inputPath, outputPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env
    })

    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve()
        return
      }
      if (code === 2 && stderr.includes('rembg is not installed')) {
        reject(new Error('rembg_not_installed'))
        return
      }
      reject(new Error(stderr.trim() || `rembg exited with code ${code}`))
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}
