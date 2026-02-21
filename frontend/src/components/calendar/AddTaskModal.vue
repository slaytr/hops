<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Room, Staff } from '../../types'

interface NewTaskData {
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  roomId: string
  staffId: string
  taskDate: string
  duration: number
}

interface Props {
  show: boolean
  rooms: Room[]
  staff: Staff[]
  initialTask: NewTaskData
}

interface Emits {
  (e: 'close'): void
  (e: 'create', taskData: NewTaskData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const newTask = ref<NewTaskData>({ ...props.initialTask })

// Watch for show prop changes to reset form
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    newTask.value = { ...props.initialTask }
  }
})

const handleClose = () => {
  emit('close')
}

const handleCreate = () => {
  emit('create', newTask.value)
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3><span class="codicon codicon-add"></span> Add New Task</h3>
        <button @click="handleClose" class="modal-close">
          <span class="codicon codicon-close"></span>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="task-type">Task Type <span class="required">*</span></label>
          <select id="task-type" v-model="newTask.taskType" class="form-control">
            <option value="cleaning">🧹 Cleaning</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="inspection">🔍 Inspection</option>
            <option value="turndown">🛏️ Turndown</option>
          </select>
        </div>

        <div class="form-divider">
          <span>All fields below are optional</span>
        </div>

        <div class="form-group">
          <label for="room">Room</label>
          <select id="room" v-model="newTask.roomId" class="form-control">
            <option value="">Unassigned</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ room.roomNumber }} - {{ room.roomType?.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="staff">Staff</label>
          <select id="staff" v-model="newTask.staffId" class="form-control">
            <option value="">Unassigned</option>
            <option v-for="member in staff" :key="member.id" :value="member.id">
              {{ member.firstName }} {{ member.lastName }} - {{ member.role }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="task-date">Task Date</label>
          <input
            id="task-date"
            type="date"
            v-model="newTask.taskDate"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="duration">Duration (days)</label>
          <input
            id="duration"
            type="number"
            v-model.number="newTask.duration"
            min="1"
            max="30"
            class="form-control"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleClose" class="btn-secondary">Cancel</button>
        <button @click="handleCreate" class="btn-primary">Create Task</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s;
}

.modal-close:hover {
  background: var(--color-background-soft);
}

.modal-close .codicon {
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-heading);
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: border-color 0.15s;
}

.form-control:focus {
  outline: none;
  border-color: var(--vt-c-green);
}

.form-control:hover {
  border-color: var(--color-border-hover);
}

.form-divider {
  margin: 1.5rem 0;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.form-divider span {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;
  font-style: italic;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid;
}

.btn-primary {
  background: var(--vt-c-green-soft);
  border-color: var(--vt-c-green-dark);
  color: var(--vt-c-green-darker);
}

.btn-primary:hover {
  background: var(--vt-c-green);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.required {
  color: #f44336;
  margin-left: 0.25rem;
}

.codicon {
  font-style: normal;
}
</style>
