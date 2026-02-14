<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const API_URL = 'http://localhost:3000'

interface HousekeepingTask {
  id: string
  roomId: string
  roomNumber?: string
  assignedUserId: string
  assignedUserName?: string
  taskDate: string
  startDateTime?: string
  endDateTime?: string
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt?: string
}

interface Room {
  id: string
  roomNumber: string
  status: string
}

interface User {
  id: string
  name: string
  role: 'staff' | 'manager' | 'admin'
  status: 'active' | 'inactive'
}

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

const tasks = ref<HousekeepingTask[]>([])
const rooms = ref<Room[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const editingTask = ref<HousekeepingTask | null>(null)

const dateFilter = ref<string>('')
const statusFilter = ref<string>('all')
const userFilter = ref<string>('all')
const isMultiDay = ref(false)

const formData = ref<TaskForm>({
  roomId: '',
  assignedUserId: '',
  taskDate: new Date().toISOString().split('T')[0],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  taskType: 'cleaning',
  priority: 'medium',
  status: 'pending',
  notes: ''
})

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

const staffUsers = computed(() => {
  return users.value.filter(u => u.role === 'staff' && u.status === 'active')
})

const resetForm = () => {
  formData.value = {
    roomId: '',
    assignedUserId: '',
    taskDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    taskType: 'cleaning',
    priority: 'medium',
    status: 'pending',
    notes: ''
  }
  isMultiDay.value = false
  editingTask.value = null
  error.value = ''
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
    // Build request body based on single-day or multi-day mode
    const requestBody: any = {
      roomId: formData.value.roomId,
      assignedUserId: formData.value.assignedUserId,
      taskType: formData.value.taskType,
      priority: formData.value.priority,
      status: formData.value.status,
      notes: formData.value.notes
    }

    if (isMultiDay.value) {
      // Multi-day task: send startDateTime and endDateTime
      requestBody.startDateTime = `${formData.value.startDate}T${formData.value.startTime || '09:00'}:00Z`
      requestBody.endDateTime = `${formData.value.endDate}T${formData.value.endTime || '17:00'}:00Z`
    } else {
      // Single-day task: send taskDate (legacy format)
      requestBody.taskDate = formData.value.taskDate
    }

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
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

const startEdit = (task: HousekeepingTask) => {
  editingTask.value = task

  // Check if this is a multi-day task
  const isMulti = isTaskMultiDay(task)
  isMultiDay.value = isMulti

  if (isMulti && task.startDateTime && task.endDateTime) {
    // Parse multi-day task date/times
    const startDate = task.startDateTime.split('T')[0]
    const endDate = task.endDateTime.split('T')[0]
    const startTime = task.startDateTime.split('T')[1]?.substring(0, 5) || '09:00'
    const endTime = task.endDateTime.split('T')[1]?.substring(0, 5) || '17:00'

    formData.value = {
      roomId: task.roomId,
      assignedUserId: task.assignedUserId,
      taskDate: task.taskDate,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      taskType: task.taskType,
      priority: task.priority,
      status: task.status,
      notes: task.notes || ''
    }
  } else {
    // Single-day task (legacy format)
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
    // Build request body based on single-day or multi-day mode
    const requestBody: any = {
      roomId: formData.value.roomId,
      assignedUserId: formData.value.assignedUserId,
      taskType: formData.value.taskType,
      priority: formData.value.priority,
      status: formData.value.status,
      notes: formData.value.notes
    }

    if (isMultiDay.value) {
      // Multi-day task: send startDateTime and endDateTime
      requestBody.startDateTime = `${formData.value.startDate}T${formData.value.startTime || '09:00'}:00Z`
      requestBody.endDateTime = `${formData.value.endDate}T${formData.value.endTime || '17:00'}:00Z`
    } else {
      // Single-day task: send taskDate (legacy format)
      requestBody.taskDate = formData.value.taskDate
    }

    const response = await fetch(`${API_URL}/tasks/${editingTask.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
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
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE'
    })

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

const startTask = async (task: HousekeepingTask) => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    })

    if (response.ok) {
      await fetchTasks()
    } else {
      const data = await response.json()
      error.value = data.error || 'Failed to start task'
    }
  } catch (e) {
    error.value = 'Failed to start task'
  } finally {
    loading.value = false
  }
}

const completeTask = async (task: HousekeepingTask) => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })

    if (response.ok) {
      await fetchTasks()
    } else {
      const data = await response.json()
      error.value = data.error || 'Failed to complete task'
    }
  } catch (e) {
    error.value = 'Failed to complete task'
  } finally {
    loading.value = false
  }
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-pending',
    in_progress: 'badge-in-progress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled'
  }
  return classes[status] || ''
}

const getPriorityBadgeClass = (priority: string) => {
  const classes: Record<string, string> = {
    low: 'badge-priority-low',
    medium: 'badge-priority-medium',
    high: 'badge-priority-high',
    urgent: 'badge-priority-urgent'
  }
  return classes[priority] || ''
}

const getTypeBadgeClass = (type: string) => {
  const classes: Record<string, string> = {
    cleaning: 'badge-type-cleaning',
    maintenance: 'badge-type-maintenance',
    inspection: 'badge-type-inspection',
    turndown: 'badge-type-turndown'
  }
  return classes[type] || ''
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
}

const formatDateOnly = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const isTaskMultiDay = (task: HousekeepingTask): boolean => {
  if (!task.startDateTime || !task.endDateTime) return false
  const startDate = task.startDateTime.split('T')[0]
  const endDate = task.endDateTime.split('T')[0]
  return startDate !== endDate
}

const formatTaskDateRange = (task: HousekeepingTask): string => {
  if (!isTaskMultiDay(task)) {
    return formatDateOnly(task.taskDate)
  }

  const start = new Date(task.startDateTime!)
  const end = new Date(task.endDateTime!)

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return `${startStr} - ${endStr} (${days} days)`
}

onMounted(async () => {
  await Promise.all([fetchTasks(), fetchRooms(), fetchUsers()])
})
</script>

<template>
  <div class="housekeeping-manager">
    <h1>Task Management</h1>

    <div class="form-container">
      <h2>{{ editingTask ? 'Edit Task' : 'Add New Task' }}</h2>

      <form @submit.prevent="editingTask ? updateTask() : addTask()">
        <div class="form-row">
          <div class="form-group">
            <label for="roomId">Room *</label>
            <select id="roomId" v-model="formData.roomId" :disabled="loading" required>
              <option value="">Select room</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.roomNumber }} ({{ room.status }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="assignedUserId">Assigned To (Staff) *</label>
            <select id="assignedUserId" v-model="formData.assignedUserId" :disabled="loading" required>
              <option value="">Select staff member</option>
              <option v-for="user in staffUsers" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="isMultiDay"
              :disabled="loading"
            />
            <span class="toggle-text">Multi-day task (spans multiple days)</span>
          </label>
        </div>

        <div v-if="!isMultiDay" class="form-row">
          <div class="form-group">
            <label for="taskDate">Task Date *</label>
            <input
              id="taskDate"
              v-model="formData.taskDate"
              type="date"
              :disabled="loading"
              required
            />
          </div>

          <div class="form-group">
            <label for="taskType">Task Type *</label>
            <select id="taskType" v-model="formData.taskType" :disabled="loading" required>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
              <option value="inspection">Inspection</option>
              <option value="turndown">Turndown</option>
            </select>
          </div>
        </div>

        <div v-if="isMultiDay">
          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date *</label>
              <input
                id="startDate"
                v-model="formData.startDate"
                type="date"
                :disabled="loading"
                required
              />
            </div>

            <div class="form-group">
              <label for="startTime">Start Time *</label>
              <input
                id="startTime"
                v-model="formData.startTime"
                type="time"
                :disabled="loading"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="endDate">End Date *</label>
              <input
                id="endDate"
                v-model="formData.endDate"
                type="date"
                :disabled="loading"
                :min="formData.startDate"
                required
              />
            </div>

            <div class="form-group">
              <label for="endTime">End Time *</label>
              <input
                id="endTime"
                v-model="formData.endTime"
                type="time"
                :disabled="loading"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="taskType">Task Type *</label>
              <select id="taskType" v-model="formData.taskType" :disabled="loading" required>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="turndown">Turndown</option>
              </select>
            </div>
            <div class="form-group">
              <!-- Spacer for layout -->
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="priority">Priority *</label>
            <select id="priority" v-model="formData.priority" :disabled="loading" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" v-model="formData.status" :disabled="loading" required>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea
            id="notes"
            v-model="formData.notes"
            rows="3"
            placeholder="Additional notes about the task"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task') }}
          </button>
          <button
            v-if="editingTask"
            type="button"
            class="btn-secondary"
            @click="resetForm"
            :disabled="loading"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div class="tasks-list">
      <div class="list-header">
        <h2>Tasks ({{ tasks.length }})</h2>
        <div class="filters">
          <input v-model="dateFilter" type="date" @change="fetchTasks" placeholder="Filter by date" />
          <select v-model="statusFilter" @change="fetchTasks">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select v-model="userFilter" @change="fetchTasks">
            <option value="all">All Staff</option>
            <option v-for="user in staffUsers" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="tasks.length" class="table-container">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Assigned To</th>
              <th>Date</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td><strong>{{ task.roomNumber || '-' }}</strong></td>
              <td>{{ task.assignedUserName || '-' }}</td>
              <td>
                {{ formatTaskDateRange(task) }}
                <span v-if="isTaskMultiDay(task)" class="multi-day-badge">📅</span>
              </td>
              <td>
                <span class="badge" :class="getTypeBadgeClass(task.taskType)">
                  {{ task.taskType }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getPriorityBadgeClass(task.priority)">
                  {{ task.priority }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(task.status)">
                  {{ task.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="timestamp">{{ formatDate(task.startedAt) }}</td>
              <td class="timestamp">{{ formatDate(task.completedAt) }}</td>
              <td class="actions">
                <button
                  v-if="task.status === 'pending'"
                  class="btn-action"
                  @click="startTask(task)"
                  :disabled="loading"
                  title="Start task"
                >
                  Start
                </button>
                <button
                  v-if="task.status === 'in_progress'"
                  class="btn-action"
                  @click="completeTask(task)"
                  :disabled="loading"
                  title="Complete task"
                >
                  Complete
                </button>
                <button
                  class="btn-edit"
                  @click="startEdit(task)"
                  :disabled="loading"
                  title="Edit task"
                >
                  Edit
                </button>
                <button
                  class="btn-delete"
                  @click="deleteTask(task.id)"
                  :disabled="loading"
                  title="Delete task"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No tasks found. Add your first housekeeping task!</p>
    </div>
  </div>
</template>

<style scoped>
.housekeeping-manager {
  width: 100%;
  padding: 1rem;
}

h1 {
  color: var(--color-heading);
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

h2 {
  color: var(--color-heading);
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.form-container {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-heading);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: background 0.2s;
}

.toggle-label:hover {
  background: var(--color-background-soft);
}

.toggle-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.toggle-text {
  font-weight: 500;
  color: var(--color-text);
}

input,
select,
textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: hsla(160, 100%, 37%, 1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: hsla(160, 100%, 37%, 1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: hsla(160, 100%, 30%, 1);
}

.btn-secondary {
  background: hsla(220, 10%, 50%, 1);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: hsla(220, 10%, 40%, 1);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #e53935;
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
}

.tasks-list {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.filters input,
.filters select {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.tasks-table th {
  font-weight: 600;
  color: var(--color-heading);
  background: var(--color-background);
}

.tasks-table tr:last-child td {
  border-bottom: none;
}

.tasks-table tbody tr:hover {
  background: var(--color-background);
}

.timestamp {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.8;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.multi-day-badge {
  margin-left: 0.5rem;
  font-size: 1rem;
}

.badge-pending {
  background: rgba(158, 158, 158, 0.2);
  color: #757575;
}

.badge-in-progress {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.badge-completed {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.badge-cancelled {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.badge-priority-low {
  background: rgba(158, 158, 158, 0.2);
  color: #9e9e9e;
}

.badge-priority-medium {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.badge-priority-high {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.badge-priority-urgent {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.badge-type-cleaning {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.badge-type-maintenance {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
}

.badge-type-inspection {
  background: rgba(156, 39, 176, 0.2);
  color: #9c27b0;
}

.badge-type-turndown {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action,
.btn-edit,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-action {
  background: hsla(160, 100%, 37%, 1);
  color: white;
}

.btn-action:hover:not(:disabled) {
  background: hsla(160, 100%, 30%, 1);
}

.btn-edit {
  background: hsla(220, 100%, 50%, 1);
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: hsla(220, 100%, 40%, 1);
}

.btn-delete {
  background: #e53935;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #c62828;
}

.empty {
  color: var(--color-text);
  opacity: 0.7;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .table-container {
    overflow-x: scroll;
  }
}
</style>
