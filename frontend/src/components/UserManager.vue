<script setup lang="ts">
import { ref, onMounted } from 'vue'

const API_URL = 'http://localhost:3000'

const users = ref<string[]>([])
const newName = ref('')
const loading = ref(false)
const error = ref('')
const showUsers = ref(true)

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`)
    const data = await response.json()
    users.value = data.users
  } catch (e) {
    error.value = 'Failed to fetch users'
  }
}

const addUser = async () => {
  if (!newName.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.value.trim() })
    })

    if (response.ok) {
      newName.value = ''
      await fetchUsers()
    } else {
      error.value = 'Failed to add user'
    }
  } catch (e) {
    error.value = 'Failed to add user'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="user-manager">
    <h2>User Manager</h2>

    <div class="add-user">
      <input
        v-model="newName"
        type="text"
        placeholder="Enter name"
        @keyup.enter="addUser"
        :disabled="loading"
      />
      <button @click="addUser" :disabled="loading || !newName.trim()">
        {{ loading ? 'Adding...' : 'Add User' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="users-list">
      <div class="users-header">
        <h3>Users ({{ users.length }})</h3>
        <button v-if="showUsers" class="toggle-btn" @click="showUsers = false">Hide</button>
        <button v-else class="toggle-btn" @click="showUsers = true">Show</button>
      </div>
      <template v-if="showUsers">
        <ul v-if="users.length">
          <li v-for="(user, index) in users" :key="index">{{ user }}</li>
        </ul>
        <p v-else class="empty">No users yet</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.user-manager {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
}

h2 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.add-user {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: hsla(160, 100%, 30%, 1);
}

.error {
  color: #e53935;
  margin-bottom: 1rem;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.users-list h3 {
  margin: 0;
  color: var(--color-heading);
}

.toggle-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  background: hsla(220, 10%, 50%, 1);
}

.toggle-btn:hover {
  background: hsla(220, 10%, 40%, 1);
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

li:last-child {
  border-bottom: none;
}

.empty {
  color: var(--color-text);
  opacity: 0.7;
}
</style>
