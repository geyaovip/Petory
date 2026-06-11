import { buildPetSystemPrompt } from '../../../src/shared/prompts/petPersonality'
import type { ChatMessage } from '../../../src/shared/types/chat'
import type { Pet } from '../../../src/shared/types/pet'
import { getKimiApiKey } from '../apiKeys'

interface KimiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface KimiResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

function getApiKey(): string {
  const key = getKimiApiKey()
  if (!key) {
    throw new Error('Kimi API Key is not configured. Add it in Settings or .env.')
  }
  return key
}

function getApiBase(): string {
  return process.env['KIMI_API_BASE'] ?? 'https://api.moonshot.cn/v1'
}

function getModel(): string {
  return process.env['KIMI_MODEL'] ?? 'moonshot-v1-8k'
}

export async function chatWithKimi(pet: Pet, history: ChatMessage[], userInput: string): Promise<string> {
  const messages: KimiMessage[] = [
    { role: 'system', content: buildPetSystemPrompt(pet) },
    ...history.map((item) => ({
      role: item.role,
      content: item.content
    })),
    { role: 'user', content: userInput }
  ]

  const response = await fetch(`${getApiBase()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: 0.7,
      max_tokens: 150
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Kimi HTTP ${response.status}: ${text}`)
  }

  const json = (await response.json()) as KimiResponse
  const content = json.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error(json.error?.message ?? 'Kimi returned an empty response')
  }

  return content
}
