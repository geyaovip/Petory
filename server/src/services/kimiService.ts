import { buildPetSystemPrompt } from '../../../src/shared/prompts/petPersonality.js'
import type { ChatMessage } from '../../../src/shared/types/chat.js'
import type { PetPersonality } from '../../../src/shared/types/pet.js'
import { config } from '../config.js'

interface KimiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface KimiResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export interface ChatPetContext {
  petId?: string
  name: string
  personality: PetPersonality
  userCallName: string
}

function buildSystemPrompt(pet: ChatPetContext): string {
  return buildPetSystemPrompt({
    id: pet.petId ?? 'remote',
    name: pet.name,
    personality: pet.personality,
    userCallName: pet.userCallName,
    imageOriginalPath: '',
    imageCompressedPath: '',
    imageMinimaxRawPath: '',
    imagePetPath: '',
    styleType: 'petory',
    level: 1,
    exp: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  })
}

export async function chatWithKimi(
  pet: ChatPetContext,
  history: ChatMessage[],
  userInput: string
): Promise<string> {
  if (!config.kimiApiKey) {
    throw new Error('KIMI_NOT_CONFIGURED')
  }

  const trimmedHistory = history.slice(-config.chatMaxHistory)
  const messages: KimiMessage[] = [
    { role: 'system', content: buildSystemPrompt(pet) },
    ...trimmedHistory.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: userInput }
  ]

  const response = await fetch(`${config.kimiApiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.kimiApiKey}`
    },
    body: JSON.stringify({
      model: config.kimiModel,
      messages,
      temperature: 0.7,
      max_tokens: 150
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`KIMI_HTTP_${response.status}: ${text}`)
  }

  const json = (await response.json()) as KimiResponse
  const content = json.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error(`KIMI_EMPTY: ${json.error?.message ?? 'empty response'}`)
  }
  return content
}
