import { Hono } from 'hono'
import type { PetPoseType, PetStyleType } from '../../../src/shared/types/pet.js'
import { config } from '../config.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import type { AuthVariables } from '../middleware/auth.js'
import { requireUser } from '../middleware/auth.js'
import { defaultPosesForUser, parsePosesJson } from '../services/entitlementService.js'
import { getBatchForUser, runGenerationBatch } from '../services/batchService.js'
import { createSinglePoseRegen, logClientLocalBatch, serializeJob } from '../services/generationService.js'
import { canConsumeGeneration, consumeGeneration, getQuotaView } from '../services/quotaService.js'
import { assertDeviceAllowed } from '../services/deviceGuardService.js'
import { prisma } from '../lib/prisma.js'

const STYLE_TYPES = new Set(['petory', 'pixel', 'sticker', 'plush', 'clay', 'cyber'])
const POSES = new Set(['idle', 'happy', 'sleep', 'focus', 'remind', 'angry'])

function errorStatus(code?: string): number {
  if (code === 'QUOTA_EXCEEDED') return 402
  if (code === 'DEVICE_FLAGGED') return 403
  if (code === 'RATE_LIMIT') return 429
  if (code === 'SERVICE_DISABLED') return 503
  return 500
}

export const generationRoutes = new Hono<{ Variables: AuthVariables }>()

generationRoutes.use('*', requireUser)

function checkGenRateLimit(userId: string, ip: string) {
  if (!checkRateLimit(`gen:user:${userId}`, 3, 60_000)) {
    return { ok: false as const, status: 429, message: '请求过于频繁，请稍后再试。' }
  }
  if (!checkRateLimit(`gen:ip:${ip}`, 20, 60_000)) {
    return { ok: false as const, status: 429, message: '请求过于频繁，请稍后再试。' }
  }
  return { ok: true as const }
}

generationRoutes.get('/quota', async (c) => {
  const user = c.get('user')!
  return c.json(await getQuotaView(user))
})

/** Client-side MiniMax: deduct one generation quota after local image generation succeeds. */
generationRoutes.post('/consume', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ deviceId?: string }>().catch(() => ({ deviceId: undefined }))
  const deviceCheck = await assertDeviceAllowed(user.id, body.deviceId)
  if (!deviceCheck.ok) {
    return c.json({ success: false, code: deviceCheck.code, message: deviceCheck.message }, 403)
  }

  const quotaCheck = await canConsumeGeneration(user)
  if (!quotaCheck.ok) {
    return c.json({ success: false, code: quotaCheck.code, message: quotaCheck.message }, 402)
  }

  await consumeGeneration(user.id, 'client_local_minimax')
  return c.json({ success: true, quota: await getQuotaView(user) })
})

/** Client-side MiniMax: log a succeeded batch after local generation (admin visibility). */
generationRoutes.post('/log-local-batch', async (c) => {
  const user = c.get('user')!
  const body = await c.req
    .json<{
      deviceId?: string
      styleType?: string
      poses?: PetPoseType[]
      clientPetId?: string
    }>()
    .catch(() => ({}))

  const deviceCheck = await assertDeviceAllowed(user.id, body.deviceId)
  if (!deviceCheck.ok) {
    return c.json({ success: false, code: deviceCheck.code, message: deviceCheck.message }, 403)
  }

  const styleType = String(body.styleType ?? 'petory')
  if (!STYLE_TYPES.has(styleType)) {
    return c.json({ success: false, message: '无效的风格类型。' }, 400)
  }

  const poses = Array.isArray(body.poses)
    ? body.poses.filter((pose): pose is PetPoseType => POSES.has(pose))
    : defaultPosesForUser(user)

  await logClientLocalBatch(user, {
    deviceId: body.deviceId,
    styleType: styleType as PetStyleType,
    poses,
    clientPetId: body.clientPetId
  })

  return c.json({ success: true })
})

generationRoutes.post('/batch', async (c) => {
  const user = c.get('user')!
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const rate = checkGenRateLimit(user.id, ip)
  if (!rate.ok) return c.json({ success: false, code: 'RATE_LIMIT', message: rate.message }, rate.status)

  const body = await c.req.parseBody()
  const image = body['image']
  const styleType = String(body['styleType'] ?? 'petory')
  const deviceId = body['deviceId'] ? String(body['deviceId']) : undefined
  const poses = parsePosesJson(body['poses'] ? String(body['poses']) : undefined, user)

  if (!(image instanceof File)) return c.json({ success: false, message: '请上传图片。' }, 400)
  if (!STYLE_TYPES.has(styleType)) return c.json({ success: false, message: '无效的风格类型。' }, 400)
  if (image.size > config.maxUploadBytes) {
    return c.json({ success: false, message: '图片超过 10MB 限制。' }, 400)
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  const result = await runGenerationBatch(user, {
    imageBuffer: buffer,
    mimeType: image.type || 'image/png',
    styleType: styleType as PetStyleType,
    poses,
    deviceId,
    jobType: 'full_batch'
  })

  const quota = await getQuotaView(user)
  if (!result.success) {
    return c.json({ ...result, quota }, errorStatus(result.code))
  }
  return c.json({ ...result.batch, quota })
})

generationRoutes.post('/complete-poses', async (c) => {
  const user = c.get('user')!
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const rate = checkGenRateLimit(user.id, ip)
  if (!rate.ok) return c.json({ success: false, code: 'RATE_LIMIT', message: rate.message }, rate.status)

  const body = await c.req.parseBody()
  const image = body['image']
  const styleType = String(body['styleType'] ?? 'petory')
  const deviceId = body['deviceId'] ? String(body['deviceId']) : undefined
  const posesRaw = body['poses'] ? String(body['poses']) : '[]'
  let poses: PetPoseType[]
  try {
    poses = JSON.parse(posesRaw) as PetPoseType[]
  } catch {
    return c.json({ success: false, message: 'poses 格式无效。' }, 400)
  }

  if (!(image instanceof File)) return c.json({ success: false, message: '请上传图片。' }, 400)
  if (image.size > config.maxUploadBytes) {
    return c.json({ success: false, message: '图片超过 10MB 限制。' }, 400)
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  const result = await runGenerationBatch(user, {
    imageBuffer: buffer,
    mimeType: image.type || 'image/png',
    styleType: styleType as PetStyleType,
    poses,
    deviceId,
    jobType: 'pose_completion'
  })

  const quota = await getQuotaView(user)
  if (!result.success) return c.json({ ...result, quota }, errorStatus(result.code))
  return c.json({ ...result.batch, quota })
})

generationRoutes.post('/regenerate-pose', async (c) => {
  const user = c.get('user')!
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const rate = checkGenRateLimit(user.id, ip)
  if (!rate.ok) return c.json({ success: false, code: 'RATE_LIMIT', message: rate.message }, rate.status)

  const body = await c.req.parseBody()
  const image = body['image']
  const styleType = String(body['styleType'] ?? 'petory')
  const pose = String(body['pose'] ?? 'idle')
  const deviceId = body['deviceId'] ? String(body['deviceId']) : undefined

  if (!(image instanceof File)) return c.json({ success: false, message: '请上传图片。' }, 400)
  if (!STYLE_TYPES.has(styleType)) return c.json({ success: false, message: '无效的风格类型。' }, 400)
  if (!POSES.has(pose)) return c.json({ success: false, message: '无效的姿势类型。' }, 400)
  if (image.size > config.maxUploadBytes) {
    return c.json({ success: false, message: '图片超过 10MB 限制。' }, 400)
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  const result = await createSinglePoseRegen(user, {
    imageBuffer: buffer,
    mimeType: image.type || 'image/png',
    styleType: styleType as PetStyleType,
    pose: pose as PetPoseType,
    deviceId
  })

  const quota = await getQuotaView(user)
  if (!result.success) return c.json({ ...result, quota }, errorStatus(result.code))
  return c.json({ ...result.job, quota })
})

/** @deprecated B1.0 兼容：单姿势整批（扣 1 次额度） */
generationRoutes.post('/jobs', async (c) => {
  const user = c.get('user')!
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const rate = checkGenRateLimit(user.id, ip)
  if (!rate.ok) return c.json({ success: false, code: 'RATE_LIMIT', message: rate.message }, rate.status)

  const body = await c.req.parseBody()
  const image = body['image']
  const styleType = String(body['styleType'] ?? 'petory')
  const pose = String(body['pose'] ?? 'idle')
  const deviceId = body['deviceId'] ? String(body['deviceId']) : undefined

  if (!(image instanceof File)) return c.json({ success: false, message: '请上传图片。' }, 400)
  const buffer = Buffer.from(await image.arrayBuffer())

  const result = await runGenerationBatch(user, {
    imageBuffer: buffer,
    mimeType: image.type || 'image/png',
    styleType: styleType as PetStyleType,
    poses: [pose as PetPoseType],
    deviceId,
    jobType: 'full_batch'
  })

  const quota = await getQuotaView(user)
  if (!result.success) {
    return c.json({ ...result, quota }, errorStatus(result.code))
  }
  const firstJob = result.batch.jobs[0]
  return c.json({ ...firstJob, batchId: result.batch.batchId, quota })
})

generationRoutes.get('/batch/:id', async (c) => {
  const user = c.get('user')!
  const batch = await getBatchForUser(user.id, c.req.param('id'))
  if (!batch) return c.json({ success: false, message: '批次不存在。' }, 404)
  const quota = await getQuotaView(user)
  return c.json({ ...batch, quota })
})

generationRoutes.get('/jobs/:id', async (c) => {
  const user = c.get('user')!
  const job = await prisma.generationJob.findFirst({
    where: { id: c.req.param('id'), userId: user.id }
  })
  if (!job) return c.json({ success: false, message: '任务不存在。' }, 404)
  const quota = await getQuotaView(user)
  return c.json({ ...serializeJob(job), quota })
})

generationRoutes.get('/poses', async (c) => {
  const user = c.get('user')!
  return c.json({ poses: defaultPosesForUser(user), plan: user.plan })
})
