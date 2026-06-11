import { randomUUID } from 'crypto'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { MOCK_REDEEM_CODES } from '../../../src/shared/entitlements'
import type {
  AuthActionResult,
  AuthSession,
  LoginInput,
  RegisterInput
} from '../../../src/shared/types/auth'
import { buildAuthState } from './entitlementService'
import {
  clearSession,
  findMockUserByEmail,
  loadMockUsers,
  loadSession,
  saveMockUsers,
  saveSession,
  updateMockUserPlan,
  type MockUserRecord
} from './authStore'
import { clearUsage } from './usageStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized)) return '请输入有效的邮箱地址。'
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return '密码至少 6 位。'
  return null
}

function toSession(user: MockUserRecord): AuthSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      plan: user.plan,
      createdAt: user.createdAt
    },
    mode: 'account',
    token: `mock_${randomUUID()}`,
    loggedInAt: new Date().toISOString()
  }
}

function success(): AuthActionResult {
  return { success: true, state: buildAuthState() }
}

function failure(message: string): AuthActionResult {
  return { success: false, message }
}

export function getAuthState() {
  return buildAuthState()
}

export function isAuthenticated(): boolean {
  return loadSession() !== null
}

export function login(input: LoginInput): AuthActionResult {
  const emailError = validateEmail(input.email)
  if (emailError) return failure(emailError)
  const passwordError = validatePassword(input.password)
  if (passwordError) return failure(passwordError)

  const user = findMockUserByEmail(input.email)
  if (!user) return failure('账号不存在，请先注册。')
  if (user.password !== input.password) return failure('邮箱或密码不正确。')

  saveSession(toSession(user))
  return success()
}

export function register(input: RegisterInput): AuthActionResult {
  const emailError = validateEmail(input.email)
  if (emailError) return failure(emailError)
  const passwordError = validatePassword(input.password)
  if (passwordError) return failure(passwordError)

  const email = input.email.trim().toLowerCase()
  if (findMockUserByEmail(email)) return failure('该邮箱已注册，请直接登录。')

  const displayName = input.displayName?.trim() || email.split('@')[0] || 'Petory 用户'
  const user: MockUserRecord = {
    id: randomUUID(),
    email,
    password: input.password,
    displayName,
    plan: 'free',
    createdAt: new Date().toISOString()
  }

  saveMockUsers([...loadMockUsers(), user])
  saveSession(toSession(user))
  return success()
}

export function logout(): AuthActionResult {
  clearSession()
  return success()
}

export function redeemCode(code: string): AuthActionResult {
  const session = loadSession()
  if (!session) return failure('请先登录。')
  const normalized = code.trim().toUpperCase()
  const plan = MOCK_REDEEM_CODES[normalized]
  if (!plan) return failure('兑换码无效。')

  updateMockUserPlan(session.user.id, plan)
  return success()
}

export function clearAuthData(): void {
  clearSession()
  clearUsage()
  const usersPath = path.join(app.getPath('userData'), 'mock-users.json')
  if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath)
}
