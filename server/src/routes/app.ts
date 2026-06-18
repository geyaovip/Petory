import { Hono } from 'hono'
import { API_VERSION, getDeploymentInfo } from '../services/deploymentService.js'
import { getPublicAppStatus, getSystemConfig } from '../services/systemConfigService.js'

export const appRoutes = new Hono()

appRoutes.get('/status', async (c) => {
  const cfg = await getSystemConfig()
  return c.json({
    version: API_VERSION,
    ...getPublicAppStatus(cfg)
  })
})

appRoutes.get('/version', (c) => {
  return c.json(getDeploymentInfo())
})
