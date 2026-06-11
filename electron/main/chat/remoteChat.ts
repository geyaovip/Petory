import type { ChatMessage } from '../../../src/shared/types/chat'
import type { Pet } from '../../../src/shared/types/pet'
import type { ServerChatSendResponse } from '../../../src/shared/types/api'
import { apiFetch } from '../api/client'
import { applyQuotaFromResponse } from '../api/remoteQuotaStore'

export async function sendRemoteChat(
  pet: Pet,
  history: ChatMessage[],
  message: string
): Promise<ServerChatSendResponse> {
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
}
