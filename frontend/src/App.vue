<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Computed properties for active states
const isOperationsHub = computed(() => route.path.startsWith('/ops-hub'))
const isSettings = computed(() => route.path.startsWith('/settings'))
const activeSettingsView = computed(() => {
  // Extract the view from the path (e.g., /settings/tasks -> tasks)
  const pathParts = route.path.split('/')
  const view = pathParts[pathParts.length - 1]
  return view || 'tasks'
})

// Tab indicator animation
const tabIndicatorStyle = ref({ left: '0px', width: '0px' })

const updateTabIndicator = async () => {
  await nextTick()
  const activeButton = document.querySelector('.tabs a.active') as HTMLElement
  if (activeButton) {
    const tabsContainer = document.querySelector('.tabs') as HTMLElement
    const containerRect = tabsContainer.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    tabIndicatorStyle.value = {
      left: `${buttonRect.left - containerRect.left}px`,
      width: `${buttonRect.width}px`
    }
  }
}

const setActiveTab = (tab: 'ops-hub' | 'settings') => {
  if (tab === 'ops-hub') {
    router.push('/ops-hub')
  } else {
    router.push('/settings/tasks')
  }
}

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  // Only handle navigation keys when not typing in an input/textarea
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      setActiveTab('ops-hub')
      break
    case 'ArrowRight':
      event.preventDefault()
      setActiveTab('settings')
      break
    case 'Backspace':
      event.preventDefault()
      // Toggle between tabs
      setActiveTab(isOperationsHub.value ? 'settings' : 'ops-hub')
      break
  }
}

// Theme management
type Theme = 'light' | 'dark'
const currentTheme = ref<Theme>('light')

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('hops-theme', theme)
  currentTheme.value = theme
}

const toggleTheme = () => {
  const nextTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  applyTheme(nextTheme)
}

const getThemeIcon = () => {
  return 'codicon-color-mode'
}

const getThemeLabel = () => {
  return currentTheme.value === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'
}

// Watch route changes to update tab indicator
watch(() => route.path, () => {
  updateTabIndicator()
})

onMounted(() => {
  // Load saved theme preference, default to light
  const savedTheme = localStorage.getItem('hops-theme') as Theme | null
  if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    applyTheme(savedTheme)
  } else {
    applyTheme('light')
  }

  // Initialize tab indicator
  updateTabIndicator()

  // Update indicator on window resize
  window.addEventListener('resize', updateTabIndicator)

  // Add keyboard navigation
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTabIndicator)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="app">
    <header>
      <h1>hops</h1>
      <nav class="tabs">
        <router-link to="/ops-hub" :class="{ active: isOperationsHub }">
          <i class="codicon codicon-calendar"></i> Operations Hub
        </router-link>
        <router-link to="/settings/tasks" :class="{ active: isSettings }">
          <i class="codicon codicon-settings-gear"></i> Settings
        </router-link>
        <div class="tab-indicator" :style="tabIndicatorStyle"></div>
      </nav>
      <button class="theme-toggle" @click="toggleTheme" :title="getThemeLabel()">
        <i class="codicon" :class="getThemeIcon()"></i>
      </button>
    </header>

    <!-- Settings sub-navigation -->
    <nav v-if="isSettings" class="settings-nav">
      <router-link to="/settings/tasks" :class="{ active: activeSettingsView === 'tasks' }">
        Tasks
      </router-link>
      <router-link to="/settings/rooms" :class="{ active: activeSettingsView === 'rooms' }">
        Rooms
      </router-link>
      <router-link to="/settings/room-types" :class="{ active: activeSettingsView === 'room-types' }">
        Room Types
      </router-link>
      <router-link to="/settings/users" :class="{ active: activeSettingsView === 'users' }">
        Users
      </router-link>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
}

header h1 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 600;
  min-width: 80px;
}

.theme-toggle {
  margin-left: auto;
  padding: 0.5rem;
  background: var(--color-background);
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
}

.theme-toggle .codicon {
  font-size: 1.1rem;
}

/* Light mode: hover shows dark mode colors */
:root[data-theme="light"] .theme-toggle:hover,
:root:not([data-theme="dark"]) .theme-toggle:hover {
  background: #121212;
  border-color: #121212;
  color: #FFFFFF;
  transform: scale(1.05);
}

/* Dark mode: hover shows light mode colors */
:root[data-theme="dark"] .theme-toggle:hover {
  background: #F5F5F5;
  border-color: #F5F5F5;
  color: #1A1A1A;
  transform: scale(1.05);
}

.tabs {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  position: relative;
}

.tabs a {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-text);
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  transition: color 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
}

.tabs a.active {
  color: var(--color-primary);
}

.tabs a:hover:not(.active) {
  color: var(--color-heading);
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-primary);
  transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.settings-nav {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.settings-nav a {
  padding: 0.4rem 0.75rem;
  background: transparent;
  color: var(--color-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
}

.settings-nav a.active {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.settings-nav a:hover:not(.active) {
  background: var(--color-background-soft);
  color: var(--color-heading);
}

main {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
