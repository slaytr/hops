import { API_URL } from '../constants'

export interface AuthUser {
  id: number
  email: string
  userType: 'staff' | 'guest' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  permissions: string[]
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error || 'Login failed')
  }
  return res.json()
}

export async function apiRegister(email: string, password: string, userType?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).error || 'Registration failed')
  }
  return res.json()
}

export async function apiGetMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export function getGoogleLoginUrl(): string {
  return `${API_URL}/auth/google`
}

export function getFacebookLoginUrl(): string {
  return `${API_URL}/auth/facebook`
}
