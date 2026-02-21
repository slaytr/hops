<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCrud } from '../../composables/useCrud'
import { API_URL } from '../../constants'
import type { Room, RoomType } from '../../types'

interface RoomForm {
  roomNumber: string
  roomTypeId: string
  floor: number | undefined
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  notes: string
}

const defaultForm = (): RoomForm => ({
  roomNumber: '',
  roomTypeId: '',
  floor: undefined,
  status: 'available',
  notes: ''
})

const { items: rooms, loading, error, editingItem: editingRoom, fetchItems: fetchRooms, createItem, updateItem, deleteItem, startEdit: startEditItem, cancelEdit } = useCrud<Room>('/rooms', 'rooms')

const roomTypes = ref<RoomType[]>([])
const statusFilter = ref<string>('all')
const roomTypeFilter = ref<string>('all')
const formData = ref<RoomForm>(defaultForm())

const fetchRoomTypes = async () => {
  try {
    const response = await fetch(`${API_URL}/room-types`)
    const data = await response.json()
    roomTypes.value = data.roomTypes
  } catch (e) {
    error.value = 'Failed to fetch room types'
  }
}

const activeRoomTypes = computed(() => roomTypes.value.filter(rt => rt.status === 'active'))

const filteredRooms = computed(() => {
  let filtered = rooms.value
  if (statusFilter.value !== 'all') filtered = filtered.filter(r => r.status === statusFilter.value)
  if (roomTypeFilter.value !== 'all') filtered = filtered.filter(r => r.roomTypeId === roomTypeFilter.value)
  return filtered
})

const resetForm = () => {
  formData.value = defaultForm()
  cancelEdit()
}

const startEdit = (room: Room) => {
  startEditItem(room)
  formData.value = {
    roomNumber: room.roomNumber,
    roomTypeId: room.roomTypeId,
    floor: room.floor,
    status: room.status,
    notes: room.notes || ''
  }
}

const handleSubmit = async () => {
  if (!formData.value.roomNumber.trim() || !formData.value.roomTypeId) {
    error.value = 'Room number and room type are required'
    return
  }

  const payload = {
    roomNumber: formData.value.roomNumber,
    roomTypeId: formData.value.roomTypeId,
    floor: formData.value.floor,
    status: formData.value.status,
    notes: formData.value.notes
  }

  const success = editingRoom.value
    ? await updateItem(editingRoom.value.id, payload)
    : await createItem(payload)

  if (success) resetForm()
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    available: 'badge-available',
    occupied: 'badge-occupied',
    maintenance: 'badge-maintenance',
    cleaning: 'badge-cleaning'
  }
  return classes[status] || ''
}

onMounted(async () => {
  await Promise.all([fetchRooms(), fetchRoomTypes()])
})
</script>

<template>
  <div class="room-manager">
    <h1>Room Management</h1>

    <div class="form-container">
      <h2>{{ editingRoom ? 'Edit Room' : 'Add New Room' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="roomNumber">Room Number *</label>
            <input id="roomNumber" v-model="formData.roomNumber" type="text" placeholder="e.g. 101, 2A" :disabled="loading" required />
          </div>
          <div class="form-group">
            <label for="roomTypeId">Room Type *</label>
            <select id="roomTypeId" v-model="formData.roomTypeId" :disabled="loading" required>
              <option value="">Select room type</option>
              <option v-for="roomType in activeRoomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="floor">Floor</label>
            <input id="floor" v-model.number="formData.floor" type="number" min="0" placeholder="e.g. 1, 2, 3" :disabled="loading" />
          </div>
          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" v-model="formData.status" :disabled="loading" required>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" v-model="formData.notes" rows="3" placeholder="Additional notes about the room" :disabled="loading" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : (editingRoom ? 'Update Room' : 'Add Room') }}
          </button>
          <button v-if="editingRoom" type="button" class="btn-secondary" @click="resetForm" :disabled="loading">Cancel</button>
        </div>
      </form>
    </div>

    <div class="rooms-list">
      <div class="list-header">
        <h2>Rooms ({{ filteredRooms.length }})</h2>
        <div class="filters">
          <select v-model="statusFilter">
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
          </select>
          <select v-model="roomTypeFilter">
            <option value="all">All Types</option>
            <option v-for="roomType in roomTypes" :key="roomType.id" :value="roomType.id">{{ roomType.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="filteredRooms.length" class="table-container">
        <table class="rooms-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Type</th>
              <th>Floor</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in filteredRooms" :key="room.id">
              <td><strong>{{ room.roomNumber }}</strong></td>
              <td>{{ room.roomTypeName || '-' }}</td>
              <td>{{ room.floor !== undefined ? `Floor ${room.floor}` : '-' }}</td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(room.status)">{{ room.status }}</span>
              </td>
              <td>{{ room.notes || '-' }}</td>
              <td class="actions">
                <button class="btn-edit" @click="startEdit(room)" :disabled="loading" title="Edit room">Edit</button>
                <button class="btn-delete" @click="deleteItem(room.id)" :disabled="loading" title="Delete room">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No rooms found. Add your first room!</p>
    </div>
  </div>
</template>

<style scoped>
.room-manager { width: 100%; padding: 1rem; }

h1 { color: var(--color-heading); margin-bottom: 1rem; font-size: 1.25rem; }
h2 { color: var(--color-heading); margin-bottom: 0.75rem; font-size: 1rem; }

.form-container {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.form-group { display: flex; flex-direction: column; }

label { margin-bottom: 0.5rem; font-weight: 500; color: var(--color-heading); }

input, select, textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
}

input:focus, select:focus, textarea:focus { outline: none; border-color: hsla(160, 100%, 37%, 1); }

.form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary { background: hsla(160, 100%, 37%, 1); color: white; }
.btn-primary:hover:not(:disabled) { background: hsla(160, 100%, 30%, 1); }
.btn-secondary { background: hsla(220, 10%, 50%, 1); color: white; }
.btn-secondary:hover:not(:disabled) { background: hsla(220, 10%, 40%, 1); }
button:disabled { opacity: 0.6; cursor: not-allowed; }

.error {
  color: #e53935;
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
}

.rooms-list { background: var(--color-background-soft); padding: 2rem; border-radius: 8px; border: 1px solid var(--color-border); }

.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.filters { display: flex; gap: 0.5rem; }
.filters select { padding: 0.5rem; font-size: 0.875rem; }

.table-container { overflow-x: auto; }

.rooms-table { width: 100%; border-collapse: collapse; }
.rooms-table th, .rooms-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--color-border); }
.rooms-table th { font-weight: 600; color: var(--color-heading); background: var(--color-background); }
.rooms-table tr:last-child td { border-bottom: none; }
.rooms-table tbody tr:hover { background: var(--color-background); }

.badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.badge-available { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
.badge-occupied { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.badge-maintenance { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
.badge-cleaning { background: rgba(255, 235, 59, 0.3); color: #f57f17; }

.actions { display: flex; gap: 0.5rem; }
.btn-edit, .btn-delete { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
.btn-edit { background: hsla(160, 100%, 37%, 1); color: white; }
.btn-edit:hover:not(:disabled) { background: hsla(160, 100%, 30%, 1); }
.btn-delete { background: #e53935; color: white; }
.btn-delete:hover:not(:disabled) { background: #c62828; }

.empty { color: var(--color-text); opacity: 0.7; text-align: center; padding: 2rem; }

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
  .list-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .table-container { overflow-x: scroll; }
}
</style>
