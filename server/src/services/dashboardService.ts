import { prisma } from '../lib/prisma.js'
import { beijingDateKey, beijingDayStartUtc } from '../lib/beijingTime.js'

export async function getEnhancedDashboard() {
  const startOfDay = beijingDayStartUtc(0)
  const weekStart = beijingDayStartUtc(6)

  const [
    totalUsers,
    todayJobs,
    todaySuccess,
    todayFailed,
    todayBatches,
    todayChats,
    todayChatSuccess,
    todayChatFailed,
    todayQuotaBlocked,
    todayNewUsers
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'active' } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay }, status: 'succeeded' } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay }, status: 'failed' } }),
    prisma.generationBatch.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.chatLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.chatLog.count({ where: { createdAt: { gte: startOfDay }, status: 'succeeded' } }),
    prisma.chatLog.count({ where: { createdAt: { gte: startOfDay }, status: 'failed' } }),
    prisma.quotaLog.count({
      where: { createdAt: { gte: startOfDay }, changeType: 'blocked' }
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } })
  ])

  const failedJobs = await prisma.generationJob.findMany({
    where: { createdAt: { gte: weekStart }, status: 'failed', errorCode: { not: null } },
    select: { errorCode: true }
  })

  const failureDistribution: Record<string, number> = {}
  for (const job of failedJobs) {
    const code = job.errorCode ?? 'UNKNOWN'
    failureDistribution[code] = (failureDistribution[code] ?? 0) + 1
  }

  const trendLast7Days: Array<{
    date: string
    generations: number
    chats: number
    newUsers: number
  }> = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = beijingDayStartUtc(offset)
    const end = beijingDayStartUtc(offset - 1)
    const date = beijingDateKey(offset)
    const [generations, chats, newUsers] = await Promise.all([
      prisma.generationJob.count({
        where: { createdAt: { gte: start, lt: end }, status: 'succeeded' }
      }),
      prisma.chatLog.count({
        where: { createdAt: { gte: start, lt: end }, status: 'succeeded' }
      }),
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } })
    ])
    trendLast7Days.push({ date, generations, chats, newUsers })
  }

  const successRate = todayJobs > 0 ? Math.round((todaySuccess / todayJobs) * 100) : 0
  const chatSuccessRate = todayChats > 0 ? Math.round((todayChatSuccess / todayChats) * 100) : 0

  return {
    totalUsers,
    todayJobs,
    todayBatches,
    todaySuccess,
    todayFailed,
    successRate,
    todayChats,
    todayChatSuccess,
    todayChatFailed,
    chatSuccessRate,
    todayQuotaBlocked,
    todayNewUsers,
    failureDistribution,
    trendLast7Days
  }
}
