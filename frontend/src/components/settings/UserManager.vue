<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete } from '../../api/client'
import { useAuth } from '../../composables/useAuth'
import type { User } from '../../types'

interface UserForm {
  email: string
  password: string
  userType: 'staff' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  // Staff fields
  firstName: string
  lastName: string
  role: string
  permissions: string[]
}

const STAFF_ROLES = ['housekeeper', 'front_desk', 'manager', 'maintenance'] as const
const APP_PERMISSIONS = [
  { key: 'ops_hub', label: 'Operations Hub', icon: 'codicon-calendar' },
  { key: 'settings', label: 'Settings', icon: 'codicon-settings-gear' },
] as const

const { currentUser } = useAuth()

const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')
const editingUser = ref<User | null>(null)

const defaultForm = (): UserForm => ({
  email: '',
  password: '',
  userType: 'staff',
  status: 'active',
  firstName: '',
  lastName: '',
  role: 'housekeeper',
  permissions: ['ops_hub'],
})

const formData = ref<UserForm>(defaultForm())

const isEditMode = computed(() => !!editingUser.value)
const isOwnAccount = (user: User) => String(user.id) === String(currentUser.value?.id)
const isStaffForm = computed(() => formData.value.userType === 'staff')

async function fetchUsers() {
  try {
    const data = await apiGet<{ users: User[] }>('/users')
    users.value = data.users
  } catch (e: any) {
    error.value = e.message || 'Failed to load users'
  }
}

function startEdit(user: User) {
  editingUser.value = user
  error.value = ''
  formData.value = {
    email: user.email,
    password: '',
    userType: user.userType === 'admin' ? 'admin' : 'staff',
    status: user.status,
    firstName: user.staff?.firstName ?? '',
    lastName: user.staff?.lastName ?? '',
    role: user.staff?.role ?? 'housekeeper',
    permissions: [...(user.staff?.permissions ?? ['ops_hub'])],
  }
}

function resetForm() {
  editingUser.value = null
  formData.value = defaultForm()
  error.value = ''
}

function togglePermission(key: string) {
  const perms = formData.value.permissions
  const idx = perms.indexOf(key)
  if (idx === -1) {
    formData.value = { ...formData.value, permissions: [...perms, key] }
  } else {
    formData.value = { ...formData.value, permissions: perms.filter(p => p !== key) }
  }
}

async function handleSubmit() {
  error.value = ''

  if (!formData.value.email.trim()) {
    error.value = 'Email is required'
    return
  }

  if (!isEditMode.value && !formData.value.password.trim()) {
    error.value = 'Password is required when creating a user'
    return
  }

  if (isStaffForm.value && (!formData.value.firstName.trim() || !formData.value.lastName.trim())) {
    error.value = 'First name and last name are required for staff'
    return
  }

  loading.value = true

  try {
    const payload: Record<string, unknown> = {
      email: formData.value.email,
      userType: formData.value.userType,
      status: formData.value.status,
    }

    if (formData.value.password) payload.password = formData.value.password

    if (isStaffForm.value) {
      payload.firstName = formData.value.firstName
      payload.lastName = formData.value.lastName
      payload.role = formData.value.role
      payload.permissions = formData.value.permissions
    }

    if (isEditMode.value && editingUser.value) {
      await apiPut(`/users/${editingUser.value.id}`, payload)
    } else {
      await apiPost('/users', payload)
    }

    await fetchUsers()
    resetForm()
  } catch (e: any) {
    error.value = e.message || 'Failed to save user'
  } finally {
    loading.value = false
  }
}

async function handleDelete(user: User) {
  if (isOwnAccount(user)) {
    error.value = 'You cannot delete your own account'
    return
  }
  if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return

  loading.value = true
  error.value = ''
  try {
    await apiDelete(`/users/${user.id}`)
    await fetchUsers()
  } catch (e: any) {
    error.value = e.message || 'Failed to delete user'
  } finally {
    loading.value = false
  }
}

function getUserTypeBadgeClass(userType: string) {
  return userType === 'admin' ? 'badge-admin' : 'badge-staff'
}

function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = { active: 'badge-active', inactive: 'badge-inactive', suspended: 'badge-suspended' }
  return map[status] || ''
}

function hasPermission(user: User, key: string) {
  if (user.userType === 'admin') return true
  return (user.staff?.permissions ?? []).includes(key)
}

function getStaffName(user: User) {
  if (!user.staff) return '—'
  return `${user.staff.firstName} ${user.staff.lastName}`
}

onMounted(fetchUsers)
</script>

<template>
  <div class="user-manager">
    <h1>Staff User Management</h1>

    <div class="form-container">
      <h2>{{ isEditMode ? 'Edit User' : 'Add Staff User' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="email">Email *</label>
            <input id="email" v-model="formData.email" type="email" placeholder="staff@hotel.com" :disabled="loading" required />
          </div>
          <div class="form-group">
            <label for="password">{{ isEditMode ? 'New Password (leave blank to keep)' : 'Password *' }}</label>
            <input id="password" v-model="formData.password" type="password" placeholder="••••••••" :disabled="loading" :required="!isEditMode" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="userType">User Type *</label>
            <select id="userType" v-model="formData.userType" :disabled="loading || isEditMode" required>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" v-model="formData.status" :disabled="loading" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <template v-if="isStaffForm">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input id="firstName" v-model="formData.firstName" type="text" placeholder="First name" :disabled="loading" required />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input id="lastName" v-model="formData.lastName" type="text" placeholder="Last name" :disabled="loading" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role">Role *</label>
              <select id="role" v-model="formData.role" :disabled="loading" required>
                <option v-for="r in STAFF_ROLES" :key="r" :value="r">{{ r.replace('_', ' ') }}</option>
              </select>
            </div>
          </div>

          <div class="form-group permissions-group">
            <label>App Access</label>
            <div class="permissions-checkboxes">
              <label v-for="perm in APP_PERMISSIONS" :key="perm.key" class="perm-checkbox">
                <input
                  type="checkbox"
                  :checked="formData.permissions.includes(perm.key)"
                  @change="togglePermission(perm.key)"
                  :disabled="loading"
                />
                <i class="codicon" :class="perm.icon"></i>
                {{ perm.label }}
              </label>
            </div>
          </div>
        </template>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Add User') }}
          </button>
          <button v-if="isEditMode" type="button" class="btn-secondary" @click="resetForm" :disabled="loading">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div class="users-list">
      <h2>Users ({{ users.length }})</h2>

      <div v-if="users.length" class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Access</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ 'own-row': isOwnAccount(user) }">
              <td>{{ getStaffName(user) }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" :class="getUserTypeBadgeClass(user.userType)">{{ user.userType }}</span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(user.status)">{{ user.status }}</span>
              </td>
              <td class="access-icons">
                <span v-if="user.userType === 'admin'" class="access-full" title="Full access">
                  <i class="codicon codicon-shield"></i>
                </span>
                <template v-else>
                  <i
                    v-for="perm in APP_PERMISSIONS"
                    :key="perm.key"
                    class="codicon access-icon"
                    :class="[perm.icon, hasPermission(user, perm.key) ? 'access-on' : 'access-off']"
                    :title="perm.label + (hasPermission(user, perm.key) ? ': allowed' : ': no access')"
                  ></i>
                </template>
              </td>
              <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
              <td class="actions">
                <button
                  class="btn-edit"
                  @click="startEdit(user)"
                  :disabled="loading"
                  title="Edit user"
                >
                  <i class="codicon codicon-edit"></i>
                </button>
                <button
                  class="btn-delete"
                  @click="handleDelete(user)"
                  :disabled="loading || isOwnAccount(user)"
                  :title="isOwnAccount(user) ? 'Cannot delete your own account' : 'Delete user'"
                >
                  <i class="codicon codicon-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No users yet. Add your first staff member!</p>
    </div>
  </div>
</template>

<style scoped>
.user-manager { width: 100%; padding: 1rem; }

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
.form-group { display: flex; flex-direction: column; margin-bottom: 0; }

label { margin-bottom: 0.5rem; font-weight: 500; color: var(--color-heading); font-size: 0.875rem; }

input, select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.95rem;
  background: var(--color-background);
  color: var(--color-text);
}
input:focus, select:focus { outline: none; border-color: var(--color-primary); }

.permissions-group { margin-top: 0.5rem; }

.permissions-checkboxes {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.perm-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  transition: all 0.15s;
  user-select: none;
}

.perm-checkbox:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.perm-checkbox input[type="checkbox"] {
  padding: 0;
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.perm-checkbox .codicon { font-size: 1rem; }

.form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { filter: brightness(0.9); }
.btn-secondary { background: var(--color-background); color: var(--color-text); border: 1px solid var(--color-border); }
.btn-secondary:hover:not(:disabled) { background: var(--color-background-soft); }
button:disabled { opacity: 0.5; cursor: not-allowed; }

.error {
  color: var(--status-cancelled);
  margin: 1rem 0 0;
  padding: 0.75rem;
  background: var(--status-cancelled-bg);
  border-radius: 4px;
  font-size: 0.875rem;
}

.users-list {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.table-container { overflow-x: auto; }

.users-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.users-table th, .users-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--color-border); }
.users-table th { font-weight: 600; color: var(--color-heading); background: var(--color-background); }
.users-table tr:last-child td { border-bottom: none; }
.users-table tbody tr:hover { background: var(--color-background); }
.own-row { background: rgba(var(--color-primary-rgb, 29, 185, 84), 0.04); }

.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; }
.badge-admin { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
.badge-staff { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
.badge-active { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
.badge-inactive { background: rgba(158, 158, 158, 0.15); color: #9e9e9e; }
.badge-suspended { background: rgba(229, 57, 53, 0.15); color: #e53935; }

.access-icons { display: flex; gap: 0.4rem; align-items: center; }
.access-icon { font-size: 1rem; }
.access-on { color: #4caf50; }
.access-off { color: var(--color-border); }
.access-full { color: #9c27b0; font-size: 1rem; }

.actions { display: flex; gap: 0.4rem; }
.btn-edit, .btn-delete {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: all 0.15s;
  display: flex;
  align-items: center;
}
.btn-edit:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.btn-delete:hover:not(:disabled) { border-color: var(--status-cancelled); color: var(--status-cancelled); }

.empty { color: var(--color-text); opacity: 0.6; text-align: center; padding: 2rem; }

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
