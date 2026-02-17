<script setup lang="ts">
type SortByType = 'roomNumber' | 'roomType'

interface Props {
  roomSortBy: SortByType
}

interface Emits {
  (e: 'add-task'): void
  (e: 'update-sort', sortBy: SortByType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleAddTask = () => {
  emit('add-task')
}

const toggleSort = () => {
  const newSort: SortByType = props.roomSortBy === 'roomNumber' ? 'roomType' : 'roomNumber'
  emit('update-sort', newSort)
}
</script>

<template>
  <div class="task-actions">
    <button class="action-btn primary" @click="handleAddTask">
      <span class="codicon codicon-add"></span>
      Task
    </button>
    <button class="action-btn">
      <span class="codicon codicon-person"></span>
      Bulk Assign
    </button>
    <button class="action-btn">
      <span class="codicon codicon-copy"></span>
      Duplicate Tasks
    </button>
    <button class="action-btn">
      <span class="codicon codicon-file-code"></span>
      Task Templates
    </button>
    <button class="action-btn">
      <span class="codicon codicon-export"></span>
      Export
    </button>
    <div style="flex-grow: 1;"></div>
    <button
      class="action-btn"
      :class="{ active: roomSortBy === 'roomType' }"
      :title="roomSortBy === 'roomNumber' ? 'Sort by room type' : 'Sort by room number'"
      @click="toggleSort"
    >
      <span class="codicon codicon-list-filter"></span>
      {{ roomSortBy === 'roomType' ? 'Type' : 'Room #' }}
    </button>
    <button class="action-btn">
      <span class="codicon codicon-layers"></span>
    </button>
  </div>
</template>

<style scoped>
.task-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.active {
  background: var(--color-primary-soft, #e8f0fe);
  border-color: var(--color-primary, #4a90d9);
  color: var(--color-primary, #4a90d9);
}

.action-btn.primary {
  background: var(--vt-c-green-soft);
  border-color: var(--vt-c-green-dark);
  color: var(--vt-c-green-darker);
  font-weight: 600;
}

.action-btn.primary:hover {
  background: var(--vt-c-green);
  border-color: var(--vt-c-green-darker);
}

.action-btn .codicon {
  font-size: 1rem;
}

.codicon {
  font-style: normal;
}

@media (max-width: 1024px) {
  .task-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1 1 auto;
    min-width: fit-content;
  }
}
</style>
