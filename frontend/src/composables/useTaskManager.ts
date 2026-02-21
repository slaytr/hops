import { ref, computed, onMounted } from 'vue'
import { API_URL } from '../constants'
import type { HousekeepingTask, Room, User } from '../types'

interface TaskForm {
  roomId: string
  assignedUserId: string
  taskDate: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
}

function defaultForm(): TaskForm {
  const today = new Date().toISOString().split('T')[0] as string
  return {
    roomId: '',
    assignedUserId: '',
    taskDate: today,
    startDate: today,
    endDate: today,
    startTime: '09:00',
    endTime: '17:00',
    taskType: 'cleaning',
    priority: 'medium',
    status: 'pending',
    notes: ''
  }
}

export function useTaskManager() {
  const tasks = ref<HousekeepingTask[]>([])
  const rooms = ref<Room[]>([])
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')
  const editingTask = ref<HousekeepingTask | null>(null)
  const isMultiDay = ref(false)

  const dateFilter = ref<string>('')
  const statusFilter = ref<string>('all')
  const userFilter = ref<string>('all')

  const formData = ref<TaskForm>(defaultForm())

  const staffUsers = computed(() => users.value.filter(u => u.role === 'staff' && u.status === 'active'))

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFilter.value) params.append('date', dateFilter.value)
      if (statusFilter.value !== 'all') params.append('status', statusFilter.value)
      if (userFilter.value !== 'all') params.append('userId', userFilter.value)

      const queryString = params.toString()
      const url = queryString ? `${API_URL}/tasks?${queryString}` : `${API_URL}/tasks`

      const response = await fetch(url)
      const data = await response.json()
      tasks.value = data.tasks
    } catch (e) {
      error.value = 'Failed to fetch tasks'
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/rooms`)
      const data = await response.json()
      rooms.value = data.rooms
    } catch (e) {
      error.value = 'Failed to fetch rooms'
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`)
      const data = await response.json()
      users.value = data.users
    } catch (e) {
      error.value = 'Failed to fetch users'
    }
  }

  const resetForm = () => {
    formData.value = defaultForm()
    isMultiDay.value = false
    editingTask.value = null
    error.value = ''
  }

  const buildRequestBody = () => {
    const body: any = {
      roomId: formData.value.roomId,
      assignedUserId: formData.value.assignedUserId,
      taskType: formData.value.taskType,
      priority: formData.value.priority,
      status: formData.value.status,
      notes: formData.value.notes
    }
    if (isMultiDay.value) {
      body.startDateTime = `${formData.value.startDate}T${formData.value.startTime || '09:00'}:00Z`
      body.endDateTime = `${formData.value.endDate}T${formData.value.endTime || '17:00'}:00Z`
    } else {
      body.taskDate = formData.value.taskDate
    }
    return body
  }

  const addTask = async () => {
    if (!formData.value.roomId || !formData.value.assignedUserId) {
      error.value = 'Room and assigned user are required'
      return
    }
    if (!isMultiDay.value && !formData.value.taskDate) {
      error.value = 'Task date is required'
      return
    }
    if (isMultiDay.value && (!formData.value.startDate || !formData.value.endDate)) {
      error.value = 'Start and end dates are required for multi-day tasks'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody())
      })
      const data = await response.json()
      if (response.ok) {
        resetForm()
        await fetchTasks()
      } else {
        error.value = data.error || 'Failed to add task'
      }
    } catch (e) {
      error.value = 'Failed to add task'
    } finally {
      loading.value = false
    }
  }

  const isTaskMultiDay = (task: HousekeepingTask): boolean => {
    if (!task.startDateTime || !task.endDateTime) return false
    return task.startDateTime.split('T')[0] !== task.endDateTime.split('T')[0]
  }

  const startEdit = (task: HousekeepingTask) => {
    editingTask.value = task
    const isMulti = isTaskMultiDay(task)
    isMultiDay.value = isMulti

    if (isMulti && task.startDateTime && task.endDateTime) {
      formData.value = {
        roomId: task.roomId,
        assignedUserId: task.assignedUserId,
        taskDate: task.taskDate,
        startDate: task.startDateTime.split('T')[0],
        endDate: task.endDateTime.split('T')[0],
        startTime: task.startDateTime.split('T')[1]?.substring(0, 5) || '09:00',
        endTime: task.endDateTime.split('T')[1]?.substring(0, 5) || '17:00',
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        notes: task.notes || ''
      }
    } else {
      formData.value = {
        roomId: task.roomId,
        assignedUserId: task.assignedUserId,
        taskDate: task.taskDate,
        startDate: task.taskDate,
        endDate: task.taskDate,
        startTime: '09:00',
        endTime: '17:00',
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        notes: task.notes || ''
      }
    }
  }

  const updateTask = async () => {
    if (!editingTask.value) return

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_URL}/tasks/${editingTask.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody())
      })
      const data = await response.json()
      if (response.ok) {
        resetForm()
        await fetchTasks()
      } else {
        error.value = data.error || 'Failed to update task'
      }
    } catch (e) {
      error.value = 'Failed to update task'
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchTasks()
      } else {
        const data = await response.json()
        error.value = data.error || 'Failed to delete task'
      }
    } catch (e) {
      error.value = 'Failed to delete task'
    } finally {
      loading.value = false
    }
  }

  const updateTaskStatus = async (task: HousekeepingTask, status: HousekeepingTask['status']) => {
    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        await fetchTasks()
      } else {
        const data = await response.json()
        error.value = data.error || `Failed to update task status`
      }
    } catch (e) {
      error.value = 'Failed to update task status'
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([fetchTasks(), fetchRooms(), fetchUsers()])
  })

  return {
    tasks,
    rooms,
    users,
    staffUsers,
    loading,
    error,
    editingTask,
    isMultiDay,
    formData,
    dateFilter,
    statusFilter,
    userFilter,
    fetchTasks,
    resetForm,
    addTask,
    startEdit,
    updateTask,
    deleteTask,
    updateTaskStatus,
    isTaskMultiDay
  }
}
