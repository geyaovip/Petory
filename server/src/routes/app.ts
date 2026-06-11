import { Hono } from 'hono'
import { getPublicAppStatus, getSystemConfig } from '../services/systemConfigService.js'

export const appRoutes = new Hono()

appRoutes.get('/status', async (c) => {
  const cfg = await getSystemConfig()
  return c.json({
    version: 'B1.4.0',
    ...getPublicAppStatus(cfg)
  })
})
