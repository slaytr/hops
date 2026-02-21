<script setup lang="ts">
import type { HousekeepingTask, Room, User } from '../../types'

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

interface Props {
  formData: TaskForm
  editingTask: HousekeepingTask | null
  isMultiDay: boolean
  loading: boolean
  error: string
  rooms: Room[]
  staffUsers: User[]
}

interface Emits {
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'update:isMultiDay', value: boolean): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="form-container">
    <h2>{{ editingTask ? 'Edit Task' : 'Add New Task' }}</h2>

    <form @submit.prevent="$emit('submit')">
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
            :checked="isMultiDay"
            :disabled="loading"
            @change="$emit('update:isMultiDay', ($event.target as HTMLInputElement).checked)"
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
            <input id="startDate" v-model="formData.startDate" type="date" :disabled="loading" required />
          </div>
          <div class="form-group">
            <label for="startTime">Start Time *</label>
            <input id="startTime" v-model="formData.startTime" type="time" :disabled="loading" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="endDate">End Date *</label>
            <input id="endDate" v-model="formData.endDate" type="date" :disabled="loading" :min="formData.startDate" required />
          </div>
          <div class="form-group">
            <label for="endTime">End Time *</label>
            <input id="endTime" v-model="formData.endTime" type="time" :disabled="loading" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="taskTypeMulti">Task Type *</label>
            <select id="taskTypeMulti" v-model="formData.taskType" :disabled="loading" required>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
              <option value="inspection">Inspection</option>
              <option value="turndown">Turndown</option>
            </select>
          </div>
          <div class="form-group"></div>
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
        <textarea id="notes" v-model="formData.notes" rows="3" placeholder="Additional notes about the task" :disabled="loading" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task') }}
        </button>
        <button v-if="editingTask" type="button" class="btn-secondary" @click="$emit('cancel')" :disabled="loading">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
