import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export type TokenRole = 'user' | 'admin'

export interface TokenPayload {
  sub: string
  role: TokenRole
  email: string
}

export function signToken(payload: TokenPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload
}
