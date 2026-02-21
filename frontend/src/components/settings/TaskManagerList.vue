<script setup lang="ts">
import type { HousekeepingTask, User } from '../../types'

interface Props {
  tasks: HousekeepingTask[]
  loading: boolean
  dateFilter: string
  statusFilter: string
  userFilter: string
  staffUsers: User[]
}

interface Emits {
  (e: 'update:dateFilter', value: string): void
  (e: 'update:statusFilter', value: string): void
  (e: 'update:userFilter', value: string): void
  (e: 'filter'): void
  (e: 'edit', task: HousekeepingTask): void
  (e: 'delete', taskId: string): void
  (e: 'start', task: HousekeepingTask): void
  (e: 'complete', task: HousekeepingTask): void
}

defineProps<Props>()
defineEmits<Emits>()

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

const isTaskMultiDay = (task: HousekeepingTask): boolean => {
  if (!task.startDateTime || !task.endDateTime) return false
  return task.startDateTime.split('T')[0] !== task.endDateTime.split('T')[0]
}

const formatTaskDateRange = (task: HousekeepingTask): string => {
  if (!isTaskMultiDay(task)) {
    return new Date(task.taskDate).toLocaleDateString()
  }
  const start = new Date(task.startDateTime!)
  const end = new Date(task.endDateTime!)
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return `${startStr} - ${endStr} (${days} days)`
}
</script>

<template>
  <div class="tasks-list">
    <div class="list-header">
      <h2>Tasks ({{ tasks.length }})</h2>
      <div class="filters">
        <input
          :value="dateFilter"
          type="date"
          @input="$emit('update:dateFilter', ($event.target as HTMLInputElement).value)"
          @change="$emit('filter')"
          placeholder="Filter by date"
        />
        <select
          :value="statusFilter"
          @change="$emit('update:statusFilter', ($event.target as HTMLSelectElement).value); $emit('filter')"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          :value="userFilter"
          @change="$emit('update:userFilter', ($event.target as HTMLSelectElement).value); $emit('filter')"
        >
          <option value="all">All Staff</option>
          <option v-for="user in staffUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
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
              <span class="badge" :class="getTypeBadgeClass(task.taskType)">{{ task.taskType }}</span>
            </td>
            <td>
              <span class="badge" :class="getPriorityBadgeClass(task.priority)">{{ task.priority }}</span>
            </td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(task.status)">{{ task.status.replace('_', ' ') }}</span>
            </td>
            <td class="timestamp">{{ formatDate(task.startedAt) }}</td>
            <td class="timestamp">{{ formatDate(task.completedAt) }}</td>
            <td class="actions">
              <button v-if="task.status === 'pending'" class="btn-action" @click="$emit('start', task)" :disabled="loading" title="Start task">Start</button>
              <button v-if="task.status === 'in_progress'" class="btn-action" @click="$emit('complete', task)" :disabled="loading" title="Complete task">Complete</button>
              <button class="btn-edit" @click="$emit('edit', task)" :disabled="loading" title="Edit task">Edit</button>
              <button class="btn-delete" @click="$emit('delete', task.id)" :disabled="loading" title="Delete task">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">No tasks found. Add your first housekeeping task!</p>
  </div>
</template>

<style scoped>
h2 {
  color: var(--color-heading);
  margin-bottom: 0.75rem;
  font-size: 1rem;
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
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
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

.badge-pending { background: rgba(158, 158, 158, 0.2); color: #757575; }
.badge-in-progress { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.badge-completed { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
.badge-cancelled { background: rgba(244, 67, 54, 0.2); color: #f44336; }
.badge-priority-low { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }
.badge-priority-medium { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.badge-priority-high { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
.badge-priority-urgent { background: rgba(244, 67, 54, 0.2); color: #f44336; }
.badge-type-cleaning { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.badge-type-maintenance { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
.badge-type-inspection { background: rgba(156, 39, 176, 0.2); color: #9c27b0; }
.badge-type-turndown { background: rgba(76, 175, 80, 0.2); color: #4caf50; }

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

.btn-action { background: hsla(160, 100%, 37%, 1); color: white; }
.btn-action:hover:not(:disabled) { background: hsla(160, 100%, 30%, 1); }
.btn-edit { background: hsla(220, 100%, 50%, 1); color: white; }
.btn-edit:hover:not(:disabled) { background: hsla(220, 100%, 40%, 1); }
.btn-delete { background: #e53935; color: white; }
.btn-delete:hover:not(:disabled) { background: #c62828; }

button:disabled { opacity: 0.6; cursor: not-allowed; }

.empty {
  color: var(--color-text);
  opacity: 0.7;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
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
