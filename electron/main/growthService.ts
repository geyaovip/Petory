import { XP_REWARDS, expProgress, levelFromExp } from '../../src/shared/growth/xp'
import { getStyleDefinition } from '../../src/shared/styles'
import type { GrowthBadge, GrowthStats, InteractionLog } from '../../src/shared/types/growth'
import { appendInteraction, getRecentInteractions, hasInteractionType } from './interactionLogStore'
import { getPetStats, processDailyOpen, touchInteraction } from './statsStore'
import { getActivePet, updatePet } from './petStore'
import { getGrowthWindow } from './windows'
import { IPC } from '../../src/shared/ipc'

export function addPetExp(
  petId: string,
  amount: number,
  reason: InteractionLog['type'],
  note: string
): { exp: number; level: number; leveledUp: boolean } {
  const pet = getActivePet()
  if (!pet || pet.id !== petId) {
    throw new Error('No active pet')
  }

  const oldLevel = levelFromExp(pet.exp)
  const exp = pet.exp + amount
  const level = levelFromExp(exp)
  updatePet(petId, { exp, level })
  touchInteraction(petId)
  appendInteraction(petId, reason, note)

  getGrowthWindow()?.webContents.send(IPC.growth.updated)
  return { exp, level, leveledUp: level > oldLevel }
}

function buildBadges(
  petId: string,
  todayFocusCount: number,
  streakDays: number,
  poseCount: number
): GrowthBadge[] {
  return [
    { id: 'first_chat', label: '初次畅聊', earned: hasInteractionType(petId, 'chat') },
    { id: 'focus_3', label: '专注达人', earned: todayFocusCount >= 3 },
    { id: 'streak_7', label: '七日陪伴', earned: streakDays >= 7 },
    { id: 'pose_master', label: '姿势收藏家', earned: poseCount >= 6 },
    { id: 'pomodoro', label: '番茄好友', earned: hasInteractionType(petId, 'pomodoro') }
  ]
}

export function getGrowthStats(): GrowthStats | null {
  const pet = getActivePet()
  if (!pet) return null

  const stats = getPetStats(pet.id)
  const progress = expProgress(pet.exp)
  const poseCount = pet.posePaths
    ? Object.keys(pet.posePaths).length
    : pet.imagePetPath
      ? 1
      : 0

  return {
    petId: pet.id,
    name: pet.name,
    styleType: pet.styleType,
    styleLabel: getStyleDefinition(pet.styleType).labelZh,
    poseCount,
    level: progress.level,
    exp: progress.current,
    expPercent: progress.percent,
    nextLevelExp: progress.next,
    todayFocusCount: stats.todayFocusCount,
    streakDays: stats.streakDays,
    lastInteractionAt: stats.lastInteractionAt,
    badges: buildBadges(pet.id, stats.todayFocusCount, stats.streakDays, poseCount),
    recentInteractions: getRecentInteractions(pet.id, 6)
  }
}

export function handleDailyOpenRewards(): void {
  const pet = getActivePet()
  if (!pet) return

  const { isFirstToday, streakDays } = processDailyOpen(pet.id)
  if (isFirstToday) {
    addPetExp(pet.id, XP_REWARDS.dailyFirstOpen, 'daily_open', '每日首次打开')
  }
  if (isFirstToday && streakDays > 1) {
    addPetExp(pet.id, XP_REWARDS.consecutiveDay, 'daily_open', `连续陪伴 ${streakDays} 天`)
  }
}

export function rewardChat(petId: string): void {
  addPetExp(petId, XP_REWARDS.chat, 'chat', '与桌宠聊天')
}

export function rewardPomodoro(petId: string, durationMin: number): void {
  addPetExp(petId, XP_REWARDS.pomodoroComplete, 'pomodoro', `完成 ${durationMin} 分钟专注`)
}
