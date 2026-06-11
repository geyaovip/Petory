export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  petId: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatSettings {
  enableChatHistory: boolean
}

export interface SendChatResult {
  success: true
  message: ChatMessage
  bubbleText: string
}

export interface SendChatFailure {
  success: false
  message: string
}

export type SendChatResponse = SendChatResult | SendChatFailure
