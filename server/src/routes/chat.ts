import { Hono } from 'hono'
import type { ChatMessage } from '../../../src/shared/types/chat.js'
import type { PetPersonality } from '../../../src/shared/types/pet.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import type { AuthVariables } from '../middleware/auth.js'
import { requireUser } from '../middleware/auth.js'
import { getChatQuotaView } from '../services/chatQuotaService.js'
import { sendChat, type ChatPetContext } from '../services/chatService.js'

export const chatRoutes = new Hono<{ Variables: AuthVariables }>()

chatRoutes.use('*', requireUser)

chatRoutes.get('/quota', async (c) => {
  const user = c.get('user')!
  return c.json(await getChatQuotaView(user))
})

chatRoutes.post('/send', async (c) => {
  const user = c.get('user')!
  const ip = c.req.header('x-forwarded-for') ?? 'local'

  if (!checkRateLimit(`chat:user:${user.id}`, 10, 60_000)) {
    return c.json({ success: false, code: 'RATE_LIMIT', message: '对话过于频繁，请稍后再试。' }, 429)
  }
  if (!checkRateLimit(`chat:ip:${ip}`, 30, 60_000)) {
    return c.json({ success: false, code: 'RATE_LIMIT', message: '对话过于频繁，请稍后再试。' }, 429)
  }

  const body = await c.req.json<{
    message?: string
    history?: ChatMessage[]
    pet?: {
      petId?: string
      name?: string
      personality?: PetPersonality
      userCallName?: string
    }
  }>()

  if (!body.message) {
    return c.json({ success: false, message: '请输入内容。' }, 400)
  }

  const pet: ChatPetContext = {
    petId: body.pet?.petId,
    name: body.pet?.name?.trim() || '桌宠',
    personality: body.pet?.personality ?? '温柔陪伴型',
    userCallName: body.pet?.userCallName?.trim() || '主人'
  }

  const result = await sendChat(user, {
    message: body.message,
    history: body.history,
    pet
  })

  if (!result.success) {
    const status = result.code === 'CHAT_QUOTA_EXCEEDED' ? 402 : 500
    const chatQuota = await getChatQuotaView(user)
    return c.json({ ...result, chatQuota }, status)
  }

  return c.json(result)
})
