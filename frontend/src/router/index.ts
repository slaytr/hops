import { createRouter, createWebHistory } from 'vue-router'
import OperationsHub from '../components/OperationsHub.vue'
import HousekeepingTaskManager from '../components/HousekeepingTaskManager.vue'
import RoomManager from '../components/RoomManager.vue'
import RoomTypeManager from '../components/RoomTypeManager.vue'
import UserManager from '../components/UserManager.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/ops-hub'
    },
    {
      path: '/ops-hub',
      name: 'operations-hub',
      component: OperationsHub
    },
    {
      path: '/settings',
      redirect: '/settings/tasks'
    },
    {
      path: '/settings/tasks',
      name: 'settings-tasks',
      component: HousekeepingTaskManager
    },
    {
      path: '/settings/rooms',
      name: 'settings-rooms',
      component: RoomManager
    },
    {
      path: '/settings/room-types',
      name: 'settings-room-types',
      component: RoomTypeManager
    },
    {
      path: '/settings/users',
      name: 'settings-users',
      component: UserManager
    }
  ]
})

export default router
