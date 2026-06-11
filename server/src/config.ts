import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

loadEnv({ path: path.join(__dirname, '../.env') })

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  jwtSecret: required('JWT_SECRET', 'petory-dev-secret'),
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://petory:petory@localhost:5433/petory?schema=public'
  ),
  minimaxApiKey: process.env.MINIMAX_API_KEY ?? '',
  minimaxApiBase: process.env.MINIMAX_API_BASE ?? 'https://api.minimaxi.com',
  minimaxGroupId: process.env.MINIMAX_GROUP_ID ?? '',
  adminEmail: (process.env.ADMIN_EMAIL ?? 'admin@petory.app').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? 'petory-admin',
  operatorEmail: (process.env.OPERATOR_EMAIL ?? 'operator@petory.app').toLowerCase(),
  operatorPassword: process.env.OPERATOR_PASSWORD ?? 'petory-operator',
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, ''),
  uploadsDir: path.join(__dirname, '../uploads'),
  maxUploadBytes: 10 * 1024 * 1024,
  jobTimeoutMs: 60_000,
  kimiApiKey: process.env.KIMI_API_KEY ?? '',
  kimiApiBase: process.env.KIMI_API_BASE ?? 'https://api.moonshot.cn/v1',
  kimiModel: process.env.KIMI_MODEL ?? 'moonshot-v1-8k',
  chatMaxHistory: 20,
  chatMaxInputChars: 2000
}
