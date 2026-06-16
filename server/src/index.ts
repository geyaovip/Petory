import { serve } from '@hono/node-server'
import { createApp, config } from './app.js'
import { prisma } from './lib/prisma.js'
import { reconcileStaleGenerationBatches } from './services/batchReconcileService.js'
import { seedAdmin } from './seed.js'

const app = createApp()

await seedAdmin()
await reconcileStaleGenerationBatches()

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.info(`[petory-server] B1.4 listening on http://localhost:${info.port}`)
  console.info(`[petory-server] admin UI: http://localhost:${info.port}/admin/`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
