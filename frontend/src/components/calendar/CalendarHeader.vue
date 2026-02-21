<script setup lang="ts">
import { ref } from 'vue'

type ViewType = 'tasklist' | 'calendar'

interface Props {
  viewType: ViewType
}

interface Emits {
  (e: 'select-view', viewType: ViewType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const viewDropdownOpen = ref(false)

const toggleViewDropdown = () => {
  viewDropdownOpen.value = !viewDropdownOpen.value
}

const selectView = (viewType: ViewType) => {
  emit('select-view', viewType)
  viewDropdownOpen.value = false
}
</script>

<template>
  <div class="calendar-header">
    <h1>
      <div class="view-selector" @click="toggleViewDropdown">
        <span
          class="codicon view-icon"
          :class="viewType === 'tasklist' ? 'codicon-calendar' : 'codicon-tasklist'"
        ></span>
        <span class="view-title">{{ viewType === 'tasklist' ? 'Housekeeping' : 'Reservations' }}</span>
        <div v-if="viewDropdownOpen" class="view-dropdown" @click.stop>
          <div class="view-option" @click="selectView('tasklist')">
            <span class="codicon codicon-calendar"></span>
            <span>Housekeeping</span>
          </div>
          <div class="view-option" @click="selectView('calendar')">
            <span class="codicon codicon-tasklist"></span>
            <span>Reservations</span>
          </div>
        </div>
      </div>
    </h1>
    <p>Visual schedule of room assignments</p>
  </div>
</template>

<style scoped>
.calendar-header {
  text-align: center;
  margin-bottom: 2rem;
}

.calendar-header h1 {
  color: var(--color-heading);
  margin-bottom: 0.25rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.view-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.view-selector:hover {
  background: var(--color-background-soft);
}

.view-icon.codicon {
  font-size: 1.3rem !important;
  display: flex;
  align-items: center;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.view-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
}

.view-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.view-option:hover {
  background: var(--color-background-soft);
}

.view-option .codicon {
  font-size: 1rem;
}

.calendar-header p {
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.9rem;
}

.codicon {
  font-style: normal;
}
</style>
