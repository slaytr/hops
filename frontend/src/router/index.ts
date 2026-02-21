import { createRouter, createWebHistory } from 'vue-router'
import OperationsHub from '../components/OperationsHub.vue'
import HousekeepingTaskManager from '../components/HousekeepingTaskManager.vue'
import RoomManager from '../components/RoomManager.vue'
import RoomTypeManager from '../components/RoomTypeManager.vue'
import UserManager from '../components/UserManager.vue'
import LoginPage from '../components/LoginPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
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
      path: '/',
      redirect: '/ops-hub'
    },
    {
      path: '/ops-hub',
      name: 'operations-hub',
      component: OperationsHub,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      redirect: '/settings/tasks'
    },
    {
      path: '/settings/tasks',
      name: 'settings-tasks',
      component: HousekeepingTaskManager,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/rooms',
      name: 'settings-rooms',
      component: RoomManager,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/room-types',
      name: 'settings-room-types',
      component: RoomTypeManager,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/users',
      name: 'settings-users',
      component: UserManager,
      meta: { requiresAuth: true }
    }
  ]
})

import { useAuth } from '../composables/useAuth'

router.beforeEach(async (to) => {
  const { isAuthenticated, restoreSession } = useAuth()

  // If not yet authenticated but we have a stored token, try to restore
  if (!isAuthenticated.value) {
    await restoreSession()
  }

  const isPublic = to.meta.public === true

  if (!isPublic && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isAuthenticated.value) {
    return { name: 'operations-hub' }
  }
})

export default router
