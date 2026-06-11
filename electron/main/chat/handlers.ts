import { randomUUID } from 'crypto'
import { toBubbleText } from '../../../src/shared/prompts/petPersonality'
import type { ChatMessage, SendChatResponse } from '../../../src/shared/types/chat'
import {
  appendChatMessage,
  getChatHistory,
  loadChatSettings
} from '../chatStore'
import { canSendChat } from '../auth/entitlementService'
import { incrementChatUsage } from '../auth/usageStore'
import { isUsingRemoteQuota } from '../api/remoteQuotaStore'
import { getActivePet } from '../petStore'
import { rewardChat } from '../growthService'
import { notifyBubble, setPetVisualState } from '../petStateService'
import { resetSedentaryTimer } from '../sedentaryService'
import { touchActivity } from '../sleepService'
import { chatWithKimi } from './kimi'
import { sendRemoteChat } from './remoteChat'

const sessionCache = new Map<string, ChatMessage[]>()

export function clearChatSession(petId: string): void {
  sessionCache.delete(petId)
}

export async function handleSendChat(userInput: string): Promise<SendChatResponse> {
  const pet = getActivePet()
  if (!pet) {
    return { success: false, message: '还没有激活的桌宠，请先创建一个。' }
  }

  const trimmed = userInput.trim()
  if (!trimmed) {
    return { success: false, message: '请输入内容。' }
  }

  const quota = canSendChat()
  if (!quota.ok) {
    return { success: false, message: quota.message }
  }

  const settings = loadChatSettings()
  const history = settings.enableChatHistory
    ? getChatHistory(pet.id)
    : (sessionCache.get(pet.id) ?? [])

  const userMessage: ChatMessage = settings.enableChatHistory
    ? appendChatMessage(pet.id, 'user', trimmed, true)
    : {
        id: randomUUID(),
        petId: pet.id,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString()
      }

  try {
    let assistantMessage: ChatMessage
    let bubbleText: string

    if (isUsingRemoteQuota()) {
      const result = await sendRemoteChat(pet, history, trimmed)
      if (!result.success) {
        const failureMessage =
          typeof result.message === 'string' ? result.message : '对话失败了，稍后再试试吧。'
        return { success: false, message: failureMessage }
      }
      if (!result.message) {
        return { success: false, message: '对话失败了，稍后再试试吧。' }
      }
      assistantMessage = result.message
      bubbleText = result.bubbleText ?? toBubbleText(result.message.content)
    } else {
      const reply = await chatWithKimi(pet, history, trimmed)
      assistantMessage = settings.enableChatHistory
        ? appendChatMessage(pet.id, 'assistant', reply, true)
        : {
            id: randomUUID(),
            petId: pet.id,
            role: 'assistant',
            content: reply,
            createdAt: new Date().toISOString()
          }
      bubbleText = toBubbleText(reply)
    }

    if (isUsingRemoteQuota() && settings.enableChatHistory) {
      appendChatMessage(pet.id, 'assistant', assistantMessage.content, true)
    }

    if (!settings.enableChatHistory) {
      sessionCache.set(pet.id, [...history, userMessage, assistantMessage])
    }

    touchActivity()
    setPetVisualState('happy', 4000)
    notifyBubble({ text: bubbleText, priority: 'normal' })
    if (!isUsingRemoteQuota()) {
      incrementChatUsage()
    }
    rewardChat(pet.id)
    resetSedentaryTimer()

    return {
      success: true,
      message: assistantMessage,
      bubbleText
    }
  } catch (error) {
    console.error('[petory] chat failed:', error)
    const message =
      error instanceof Error && error.message.includes('KIMI_API_KEY')
        ? '请先在 .env 中配置 KIMI_API_KEY，或配置 PETORY_API_BASE_URL 使用后台对话。'
        : error instanceof Error
          ? error.message
          : '对话失败了，稍后再试试吧。'
    return { success: false, message }
  }
}
