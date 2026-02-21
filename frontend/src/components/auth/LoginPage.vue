<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiLogin, apiRegister, apiGetMe, getGoogleLoginUrl, getFacebookLoginUrl } from '../../api/auth'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { setAuth } = useAuth()

const mode = ref<'signin' | 'register'>('signin')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const showOAuth = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED !== 'false'

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'register' : 'signin'
  errorMsg.value = ''
}

async function handleSubmit() {
  if (!email.value || !password.value) {
    errorMsg.value = 'Email and password are required.'
    return
  }
  submitting.value = true
  errorMsg.value = ''
  try {
    let result
    if (mode.value === 'signin') {
      result = await apiLogin(email.value, password.value)
    } else {
      result = await apiRegister(email.value, password.value)
    }
    setAuth(result.token, result.user)
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' && redirect ? redirect : '/ops-hub')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'An error occurred.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // OAuth callback passes token in URL fragment (#token=...) to keep it out of server logs
  const hash = window.location.hash
  const hashToken = hash.startsWith('#token=') ? hash.slice(7) : null
  if (hashToken) {
    // Clear the fragment immediately so it doesn't persist in history
    history.replaceState(null, '', window.location.pathname + window.location.search)
    try {
      const { user } = await apiGetMe(hashToken)
      setAuth(hashToken, user)
      router.push('/ops-hub')
    } catch {
      // token is invalid, stay on login page
    }
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="brand">hops</h1>
      <p class="brand-subtitle">Hotel Operations System</p>

      <h2 class="form-title">
        {{ mode === 'signin' ? 'Sign in to your account' : 'Create an account' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="field">
          <label for="email">
            <i class="codicon codicon-mail field-icon"></i>
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            :disabled="submitting"
            required
          />
        </div>

        <div class="field">
          <label for="password">
            <i class="codicon codicon-lock field-icon"></i>
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="submitting"
            required
          />
        </div>

        <div v-if="errorMsg" class="error-message" role="alert">
          <i class="codicon codicon-error"></i>
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-primary" :disabled="submitting">
          <i class="codicon" :class="mode === 'signin' ? 'codicon-sign-in' : 'codicon-person-add'"></i>
          <span v-if="submitting">{{ mode === 'signin' ? 'Signing in…' : 'Creating account…' }}</span>
          <span v-else>{{ mode === 'signin' ? 'Sign in' : 'Create account' }}</span>
        </button>
      </form>

      <div v-if="showOAuth" class="divider">
        <span>or continue with</span>
      </div>

      <div v-if="showOAuth" class="oauth-buttons">
        <a :href="getGoogleLoginUrl()" class="btn-oauth btn-google">
          <svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>
        <a :href="getFacebookLoginUrl()" class="btn-oauth btn-facebook">
          <svg class="oauth-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
      </div>

      <p class="toggle-mode">
        {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
        <button type="button" class="link-btn" @click="toggleMode">
          {{ mode === 'signin' ? 'Create one' : 'Sign in' }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 1rem;
}

.login-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.brand {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 0.125rem 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  text-align: center;
  margin: 0 0 1.75rem 0;
  letter-spacing: 0.03em;
}

.form-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 1.25rem 0;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.field-icon {
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

.field input {
  padding: 0.625rem 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  font-family: inherit;
}

.field input::placeholder {
  color: var(--color-text-soft);
}

.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  background: var(--status-cancelled-bg);
  border: 1px solid var(--status-cancelled);
  border-radius: 6px;
  color: var(--status-cancelled);
  font-size: 0.8rem;
}

.error-message .codicon {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  font-family: inherit;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary .codicon {
  font-size: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
  color: var(--color-text-soft);
  font-size: 0.75rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.oauth-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-oauth {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
}

.btn-oauth:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-mute);
}

.oauth-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toggle-mode {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-soft);
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 0 0.125rem;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-btn:hover {
  color: var(--color-primary-hover);
}
</style>
