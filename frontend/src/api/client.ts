import { API_URL } from '../constants'

const TOKEN_KEY = 'hops-auth-token'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { ...getAuthHeaders() }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error || `GET ${path} failed`)
  }
  return response.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error || `POST ${path} failed`)
  }
  return response.json()
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body)
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error || `PUT ${path} failed`)
  }
  return response.json()
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error || `DELETE ${path} failed`)
  }
}
