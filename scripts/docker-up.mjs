#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const result = spawnSync('docker', ['compose', 'up', '-d', 'postgres', 'website'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.info('')
console.info('[petory] Docker 已启动: postgres (:5433) + 官网 (:5180)')
console.info('[petory] 管理端不在 Docker 里，需在本机另开终端启动 API：')
console.info('')
console.info('  npm run setup:dev    # 首次或改过数据库时')
console.info('  npm run server:dev   # 保持运行')
console.info('')
console.info('  管理端  http://localhost:8787/admin/')
console.info('  官网    http://localhost:5180/')
console.info('')
console.info('  或一条命令起 API + 客户端: npm run dev:docker')
console.info('')
