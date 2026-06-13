import type { ChatMessage } from '../../../src/shared/types/chat'
import type { Pet } from '../../../src/shared/types/pet'
import type { ServerChatSendResponse } from '../../../src/shared/types/api'
import { ApiError, apiFetch } from '../api/client'
import { applyQuotaFromResponse } from '../api/remoteQuotaStore'

function formatRemoteChatError(error: unknown): ServerChatSendResponse {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR' || error.status === 0) {
      return {
        success: false,
        message:
          '无法连接后台 API（默认 http://localhost:8787）。请在项目目录另开终端运行 npm run server:dev，或使用 npm run dev:stack 同时启动数据库、API 与客户端。'
      }
    }
    if (error.code === 'AUTH_EXPIRED') {
      return { success: false, message: '登录已过期，请重新登录。' }
    }
    return { success: false, message: error.message }
  }
  return { success: false, message: '对话失败了，稍后再试试吧。' }
}

export async function sendRemoteChat(
  pet: Pet,
  history: ChatMessage[],
  message: string
): Promise<ServerChatSendResponse> {
  try {
    const result = await apiFetch<ServerChatSendResponse>('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        pet: {
          petId: pet.id,
          name: pet.name,
          personality: pet.personality,
          userCallName: pet.userCallName
        }
      })
    })

    if (result.chatQuota) {
      applyQuotaFromResponse({ chatQuota: result.chatQuota })
    }

    return result
  } catch (error) {
    console.error('[petory] remote chat failed:', error)
    return formatRemoteChatError(error)
  }
}
