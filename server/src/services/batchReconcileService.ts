import { prisma } from '../lib/prisma.js'

const STALE_BATCH_MS = 30 * 60 * 1000
const INTERRUPTED_MESSAGE = '生成超时或服务中断，已自动标记为失败。'

export async function reconcileStaleGenerationBatches(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_BATCH_MS)
  const staleBatches = await prisma.generationBatch.findMany({
    where: { status: 'processing', updatedAt: { lt: cutoff } },
    include: { jobs: true }
  })

  if (staleBatches.length === 0) return 0

  for (const batch of staleBatches) {
    await prisma.generationJob.updateMany({
      where: { batchId: batch.id, status: 'processing' },
      data: {
        status: 'failed',
        errorCode: 'INTERRUPTED',
        errorMessage: INTERRUPTED_MESSAGE
      }
    })

    const jobs = await prisma.generationJob.findMany({ where: { batchId: batch.id } })
    const posesSucceeded = jobs.filter((job) => job.status === 'succeeded').length
    const posesTotal = jobs.length
    let status = 'failed'
    if (posesSucceeded > 0 && posesSucceeded < posesTotal) {
      status = 'partial'
    }

    await prisma.generationBatch.update({
      where: { id: batch.id },
      data: { status, posesSucceeded }
    })
  }

  console.info(`[petory] reconciled ${staleBatches.length} stale generation batch(es)`)
  return staleBatches.length
}
