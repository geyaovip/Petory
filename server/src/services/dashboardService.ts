import { prisma } from '../lib/prisma.js'
import { todayKey } from '../lib/entitlements.js'

function dayStart(offsetDays: number): Date {
  const today = todayKey()
  const d = new Date(`${today}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - offsetDays)
  return d
}

export async function getEnhancedDashboard() {
  const today = todayKey()
  const startOfDay = new Date(`${today}T00:00:00.000Z`)
  const weekStart = dayStart(6)

  const [
    totalUsers,
    proUsers,
    todayJobs,
    todaySuccess,
    todayFailed,
    todayBatches,
    activeCodes,
    todayChats,
    todayChatSuccess,
    todayChatFailed,
    todayQuotaBlocked,
    todayNewUsers
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { plan: 'pro', status: 'active' } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay }, status: 'succeeded' } }),
    prisma.generationJob.count({ where: { createdAt: { gte: startOfDay }, status: 'failed' } }),
    prisma.generationBatch.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.redeemCode.count({ where: { active: true } }),
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
    const start = dayStart(offset)
    const end = dayStart(offset - 1)
    const date = start.toISOString().slice(0, 10)
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
    proUsers,
    todayJobs,
    todayBatches,
    todaySuccess,
    todayFailed,
    successRate,
    activeRedeemCodes: activeCodes,
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
