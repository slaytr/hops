import { createRouter, createWebHistory } from 'vue-router'
import OperationsHub from '../components/calendar/OperationsHub.vue'
import HousekeepingTaskManager from '../components/settings/HousekeepingTaskManager.vue'
import RoomManager from '../components/settings/RoomManager.vue'
import RoomTypeManager from '../components/settings/RoomTypeManager.vue'
import UserManager from '../components/settings/UserManager.vue'
import LoginPage from '../components/auth/LoginPage.vue'
import AccessDenied from '../components/auth/AccessDenied.vue'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    requiresPermission?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { public: true }
    },
    {
      path: '/access-denied',
      name: 'access-denied',
      component: AccessDenied,
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: () => getDefaultRedirect()
    },
    {
      path: '/ops-hub',
      name: 'operations-hub',
      component: OperationsHub,
      meta: { requiresAuth: true, requiresPermission: 'ops_hub' }
    },
    {
      path: '/settings',
      redirect: '/settings/tasks'
    },
    {
      path: '/settings/tasks',
      name: 'settings-tasks',
      component: HousekeepingTaskManager,
      meta: { requiresAuth: true, requiresPermission: 'settings' }
    },
    {
      path: '/settings/rooms',
      name: 'settings-rooms',
      component: RoomManager,
      meta: { requiresAuth: true, requiresPermission: 'settings' }
    },
    {
      path: '/settings/room-types',
      name: 'settings-room-types',
      component: RoomTypeManager,
      meta: { requiresAuth: true, requiresPermission: 'settings' }
    },
    {
      path: '/settings/users',
      name: 'settings-users',
      component: UserManager,
      meta: { requiresAuth: true, requiresPermission: 'settings' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: () => getDefaultRedirect()
    }
  ]
})

import { useAuth } from '../composables/useAuth'
import type { AuthUser } from '../api/auth'

function getDefaultRoute(user: AuthUser): string {
  if (user.userType === 'admin') return '/ops-hub'
  if (user.permissions.includes('ops_hub')) return '/ops-hub'
  if (user.permissions.includes('settings')) return '/settings/tasks'
  return '/access-denied'
}

function getDefaultRedirect(): string {
  const { currentUser } = useAuth()
  if (!currentUser.value) return '/login'
  return getDefaultRoute(currentUser.value)
}

function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.userType === 'admin') return true
  return user.permissions.includes(permission)
}

router.beforeEach(async (to) => {
  const { isAuthenticated, currentUser, restoreSession } = useAuth()

  if (!isAuthenticated.value) {
    await restoreSession()
  }

  const isPublic = to.meta.public === true

  if (!isPublic && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && isAuthenticated.value) {
    return getDefaultRoute(currentUser.value!)
  }

  // Permission check for authenticated routes
  const requiredPermission = to.meta.requiresPermission
  if (requiredPermission) {
    if (!currentUser.value) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (!hasPermission(currentUser.value, requiredPermission)) {
      return getDefaultRoute(currentUser.value)
    }
  }
})

export default router
