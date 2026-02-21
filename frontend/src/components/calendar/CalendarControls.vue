<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Props {
  daysToShow: number
}

interface Emits {
  (e: 'navigate-days', offset: number): void
  (e: 'go-to-today'): void
  (e: 'date-change', date: Date): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchExpanded = ref(false)
const searchCollapsing = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const datePickerInput = ref<HTMLInputElement | null>(null)

const toggleSearch = () => {
  searchExpanded.value = !searchExpanded.value
  if (searchExpanded.value) {
    // Focus the input after it renders
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    searchQuery.value = ''
  }
}

const handleSearchBlur = () => {
  // Only collapse if search is empty
  if (searchQuery.value.trim() === '') {
    searchCollapsing.value = true
    // Wait for animation to complete before hiding input
    setTimeout(() => {
      searchExpanded.value = false
      searchCollapsing.value = false
    }, 300) // Match animation duration
  }
}

const openDatePicker = () => {
  datePickerInput.value?.showPicker()
}

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    const selectedDate = new Date(target.value)
    emit('date-change', selectedDate)
  }
}

const navigateDays = (offset: number) => {
  emit('navigate-days', offset)
}

const goToToday = () => {
  emit('go-to-today')
}
</script>

<template>
  <div class="calendar-controls">
    <div class="search-section">
      <div class="find-container" :class="{ 'expanded': searchExpanded, 'collapsing': searchCollapsing }">
        <button v-if="!searchExpanded" @click="toggleSearch" class="nav-btn find-btn">
          <span class="codicon codicon-search"></span> Find
        </button>
        <input
          v-else
          v-model="searchQuery"
          type="text"
          class="search-input"
          :class="{ 'collapsing': searchCollapsing }"
          placeholder="Search rooms..."
          @blur="handleSearchBlur"
          ref="searchInput"
        />
      </div>

      <div class="goto-container">
        <button @click="openDatePicker" class="nav-btn goto-btn">
          <span class="codicon codicon-chevron-right"></span> Go to
        </button>
        <input
          type="date"
          class="date-picker-input-hidden"
          @change="handleDateChange"
          ref="datePickerInput"
        />
      </div>
    </div>

    <div class="date-navigation">
      <button @click="navigateDays(-7)" class="nav-btn">
        <span class="codicon codicon-arrow-left"></span> Prev
      </button>
      <button @click="goToToday" class="nav-btn today-btn">
        Today
      </button>
      <button @click="navigateDays(7)" class="nav-btn">
        Next <span class="codicon codicon-arrow-right"></span>
      </button>
    </div>

    <div class="view-options">
      <div class="days-display">
        Showing {{ daysToShow }} days
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  gap: 1rem;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.goto-container {
  position: relative;
}

.find-container {
  width: auto;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.goto-btn,
.find-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.codicon {
  font-style: normal;
  font-size: 0.9rem;
}

.date-picker-input-hidden {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.search-input {
  width: 250px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
  animation: expandWidth 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.search-input.collapsing {
  animation: collapseWidth 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  width: 75px;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

@keyframes expandWidth {
  from {
    width: 75px;
  }
  to {
    width: 250px;
  }
}

@keyframes collapseWidth {
  from {
    width: 250px;
  }
  to {
    width: 75px;
  }
}

.date-navigation {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
}

.nav-btn {
  padding: 0.5rem 1rem;
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.nav-btn:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.today-btn {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.today-btn:hover {
  background: var(--color-primary-hover);
}

.view-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.days-display {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.8;
  padding: 0.5rem 0.75rem;
  background: var(--color-background);
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

@media (max-width: 1024px) {
  .calendar-controls {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .search-section {
    justify-content: center;
  }

  .search-input {
    max-width: 100%;
  }

  .date-navigation {
    justify-content: center;
  }

  .view-options {
    justify-content: center;
  }
}
</style>
