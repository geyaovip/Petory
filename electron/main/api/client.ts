import { handleAuthExpired } from '../auth/sessionGuard'
import { loadSession } from '../auth/authStore'
import { getApiBaseUrl } from './config'
import { getLocalDeviceId } from './deviceId'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl()
  if (!base) {
    throw new ApiError('未配置 PETORY_API_BASE_URL。', 0, 'API_NOT_CONFIGURED')
  }

  const headers = new Headers(options.headers)
  if (options.auth !== false) {
    const token = loadSession()?.token
    if (token && token !== 'offline') {
      headers.set('Authorization', `Bearer ${token}`)
      headers.set('X-Petory-Device-Id', getLocalDeviceId())
    }
  }

  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers
    })
  } catch {
    throw new ApiError('网络连接失败，请检查 API 地址与网络后重试。', 0, 'NETWORK_ERROR')
  }

  const data = (await response.json().catch(() => ({}))) as T & {
    success?: boolean
    message?: string
    code?: string
  }

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      handleAuthExpired()
      throw new ApiError('登录已过期，请重新登录。', 401, 'AUTH_EXPIRED')
    }
    throw new ApiError(data.message || response.statusText, response.status, data.code)
  }

  return data
}

export async function apiFetchPublic<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { auth: false })
}
