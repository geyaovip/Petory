export const API_VERSION = 'B1.4.0'

function clean(value?: string): string | null {
  const text = value?.trim()
  if (!text || text === 'local' || text === 'unknown') return null
  return text
}

export function getDeploymentInfo() {
  const sha = clean(process.env.DEPLOY_SHA)
  const shortSha = sha ? sha.slice(0, 7) : null
  const clientVersion = clean(process.env.DEPLOY_VERSION)
  const deployedAt = clean(process.env.DEPLOYED_AT)

  return {
    apiVersion: API_VERSION,
    clientVersion,
    commit: sha,
    shortCommit: shortSha,
    deployedAt,
    environment: process.env.NODE_ENV ?? 'production'
  }
}
