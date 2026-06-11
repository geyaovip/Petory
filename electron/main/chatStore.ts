import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { ChatMessage, ChatSettings } from '../../src/shared/types/chat'
import { loadUserSettings, saveUserSettings } from './settingsStore'

const CHAT_FILE = 'chat-history.json'

interface ChatStoreFile {
  messages: ChatMessage[]
}

function getChatPath(): string {
  return path.join(app.getPath('userData'), CHAT_FILE)
}

function loadChatFile(): ChatStoreFile {
  try {
    return JSON.parse(fs.readFileSync(getChatPath(), 'utf-8')) as ChatStoreFile
  } catch {
    return { messages: [] }
  }
}

function saveChatFile(data: ChatStoreFile): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(getChatPath(), JSON.stringify(data, null, 2), 'utf-8')
}

export function loadChatSettings(): ChatSettings {
  const settings = loadUserSettings()
  return { enableChatHistory: settings.enableChatHistory }
}

export function saveChatSettings(settings: ChatSettings): void {
  saveUserSettings({ ...loadUserSettings(), enableChatHistory: settings.enableChatHistory })
}

export function getChatHistory(petId: string): ChatMessage[] {
  const file = loadChatFile()
  return file.messages.filter((m) => m.petId === petId)
}

export function appendChatMessage(
  petId: string,
  role: ChatMessage['role'],
  content: string,
  persist: boolean
): ChatMessage {
  const message: ChatMessage = {
    id: randomUUID(),
    petId,
    role,
    content,
    createdAt: new Date().toISOString()
  }

  if (!persist) return message

  const file = loadChatFile()
  file.messages.push(message)
  saveChatFile(file)
  return message
}

export function clearChatHistory(petId?: string): void {
  const file = loadChatFile()
  if (petId) {
    file.messages = file.messages.filter((m) => m.petId !== petId)
  } else {
    file.messages = []
  }
  saveChatFile(file)
}
