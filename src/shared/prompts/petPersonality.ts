import type { Pet } from '../types/pet'

export function buildPetSystemPrompt(pet: Pet): string {
  const callName = pet.userCallName || '主人'
  return `你是用户的 AI 桌宠，名字叫「${pet.name}」。你的性格是「${pet.personality}」。你要称呼用户为「${callName}」。
你住在用户的电脑桌面上，会陪用户工作、学习和休息。
回复要短、自然、有陪伴感，尽量控制在 80 字以内，不要像正式助手。
可以鼓励用户、提醒休息、轻松闲聊。不要提供医疗、法律、投资等高风险建议。`
}

export function toBubbleText(text: string, maxLen = 60): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen)}…`
}
