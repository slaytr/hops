<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCrud } from '../../composables/useCrud'
import type { RoomType } from '../../types'

interface RoomTypeForm {
  name: string
  description: string
  baseRate: number
  maxOccupancy: number
  amenitiesInput: string
  status: 'active' | 'inactive'
}

const defaultForm = (): RoomTypeForm => ({
  name: '',
  description: '',
  baseRate: 99.99,
  maxOccupancy: 1,
  amenitiesInput: '',
  status: 'active'
})

const { items: roomTypes, loading, error, editingItem: editingRoomType, fetchItems: fetchRoomTypes, createItem, updateItem, deleteItem, startEdit: startEditItem, cancelEdit } = useCrud<RoomType>('/room-types', 'roomTypes')

const formData = ref<RoomTypeForm>(defaultForm())

const resetForm = () => {
  formData.value = defaultForm()
  cancelEdit()
}

const startEdit = (roomType: RoomType) => {
  startEditItem(roomType)
  formData.value = {
    name: roomType.name,
    description: roomType.description || '',
    baseRate: roomType.baseRate,
    maxOccupancy: roomType.maxOccupancy,
    amenitiesInput: roomType.amenities?.join(', ') || '',
    status: roomType.status
  }
}

const buildPayload = () => {
  const amenities = formData.value.amenitiesInput
    .split(',')
    .map(a => a.trim())
    .filter(a => a.length > 0)

  return {
    name: formData.value.name,
    description: formData.value.description,
    baseRate: formData.value.baseRate,
    maxOccupancy: formData.value.maxOccupancy,
    amenities: amenities.length > 0 ? amenities : undefined,
    status: formData.value.status
  }
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    error.value = 'Name is required'
    return
  }

  const success = editingRoomType.value
    ? await updateItem(editingRoomType.value.id, buildPayload())
    : await createItem(buildPayload())

  if (success) resetForm()
}

const getStatusBadgeClass = (status: string) => status === 'active' ? 'badge-active' : 'badge-inactive'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

onMounted(fetchRoomTypes)
</script>

<template>
  <div class="room-type-manager">
    <h1>Room Type Management</h1>

    <div class="form-container">
      <h2>{{ editingRoomType ? 'Edit Room Type' : 'Add New Room Type' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Name *</label>
            <input id="name" v-model="formData.name" type="text" placeholder="e.g. Deluxe Suite" :disabled="loading" required />
          </div>
          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" v-model="formData.status" :disabled="loading" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="baseRate">Base Rate (per night) *</label>
            <input id="baseRate" v-model.number="formData.baseRate" type="number" step="0.01" min="0" placeholder="99.99" :disabled="loading" required />
          </div>
          <div class="form-group">
            <label for="maxOccupancy">Max Occupancy *</label>
            <input id="maxOccupancy" v-model.number="formData.maxOccupancy" type="number" min="1" placeholder="2" :disabled="loading" required />
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" v-model="formData.description" rows="3" placeholder="Brief description of the room type" :disabled="loading" />
        </div>

        <div class="form-group">
          <label for="amenities">Amenities (comma-separated)</label>
          <input id="amenities" v-model="formData.amenitiesInput" type="text" placeholder="WiFi, TV, Mini Bar, Coffee Maker" :disabled="loading" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : (editingRoomType ? 'Update Room Type' : 'Add Room Type') }}
          </button>
          <button v-if="editingRoomType" type="button" class="btn-secondary" @click="resetForm" :disabled="loading">Cancel</button>
        </div>
      </form>
    </div>

    <div class="room-types-list">
      <h2>Room Types ({{ roomTypes.length }})</h2>

      <div v-if="roomTypes.length" class="table-container">
        <table class="room-types-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Base Rate</th>
              <th>Max Occupancy</th>
              <th>Amenities</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="roomType in roomTypes" :key="roomType.id">
              <td><strong>{{ roomType.name }}</strong></td>
              <td>{{ roomType.description || '-' }}</td>
              <td>{{ formatCurrency(roomType.baseRate) }}</td>
              <td>{{ roomType.maxOccupancy }} {{ roomType.maxOccupancy === 1 ? 'guest' : 'guests' }}</td>
              <td>
                <div v-if="roomType.amenities && roomType.amenities.length" class="amenities">
                  <span v-for="amenity in roomType.amenities" :key="amenity" class="badge badge-amenity">{{ amenity }}</span>
                </div>
                <span v-else>-</span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(roomType.status)">{{ roomType.status }}</span>
              </td>
              <td class="actions">
                <button class="btn-edit" @click="startEdit(roomType)" :disabled="loading" title="Edit room type">Edit</button>
                <button class="btn-delete" @click="deleteItem(roomType.id)" :disabled="loading" title="Delete room type">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No room types yet. Add your first room type!</p>
    </div>
  </div>
</template>

<style scoped>
.room-type-manager { width: 100%; padding: 1rem; }

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

.room-types-list { background: var(--color-background-soft); padding: 2rem; border-radius: 8px; border: 1px solid var(--color-border); }

.table-container { overflow-x: auto; }

.room-types-table { width: 100%; border-collapse: collapse; }
.room-types-table th, .room-types-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--color-border); }
.room-types-table th { font-weight: 600; color: var(--color-heading); background: var(--color-background); }
.room-types-table tr:last-child td { border-bottom: none; }
.room-types-table tbody tr:hover { background: var(--color-background); }

.amenities { display: flex; flex-wrap: wrap; gap: 0.25rem; }

.badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; text-transform: capitalize; }
.badge-amenity { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.badge-active { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
.badge-inactive { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }

.actions { display: flex; gap: 0.5rem; }
.btn-edit, .btn-delete { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
.btn-edit { background: hsla(160, 100%, 37%, 1); color: white; }
.btn-edit:hover:not(:disabled) { background: hsla(160, 100%, 30%, 1); }
.btn-delete { background: #e53935; color: white; }
.btn-delete:hover:not(:disabled) { background: #c62828; }

.empty { color: var(--color-text); opacity: 0.7; text-align: center; padding: 2rem; }

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
  .table-container { overflow-x: scroll; }
}
</style>
