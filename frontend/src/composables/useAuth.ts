import { ref, computed } from 'vue'
import type { AuthUser } from '../api/auth'
import { apiGetMe } from '../api/auth'

const TOKEN_KEY = 'hops-auth-token'

const currentUser = ref<AuthUser | null>(null)
const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const loading = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => !!currentUser.value && !!token.value)

  function setAuth(newToken: string, user: AuthUser) {
    token.value = newToken
    currentUser.value = user
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function clearAuth() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function restoreSession(): Promise<boolean> {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (!saved) return false
    try {
      loading.value = true
      const { user } = await apiGetMe(saved)
      token.value = saved
      currentUser.value = user
      return true
    } catch {
      clearAuth()
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    currentUser,
    token,
    loading,
    isAuthenticated,
    setAuth,
    clearAuth,
    restoreSession,
  }
}
