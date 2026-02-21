<script setup lang="ts">
interface Props {
  dates: Date[]
  getDayName: (date: Date) => string
  getMonthAbbr: (date: Date) => string
  isTodayInVisibleRange: (date: Date) => boolean
  isWeekend: (date: Date) => boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div class="dates-header">
    <div
      v-for="date in dates"
      :key="date.toISOString()"
      class="date-header"
      :class="{ 'is-today': isTodayInVisibleRange(date), 'is-weekend': isWeekend(date) }"
    >
      <div class="date-day">{{ getDayName(date) }}</div>
      <div class="date-bottom">
        <span class="date-number">{{ date.getDate() }}</span>
        <span class="date-month">{{ getMonthAbbr(date) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dates-header {
  display: flex;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 15;
  background: var(--color-background);
  border-top: 2px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
  user-select: none;
}

.date-header {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--color-border);
  background: var(--color-background-soft);
  transition: all 0.2s;
  gap: 0.1rem;
}

.date-header:last-child {
  border-right: none;
}

.date-header.is-today {
  background: rgba(66, 165, 245, 0.1);
}

.date-header.is-weekend {
  background: rgba(255, 152, 0, 0.05);
}

.date-day {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  opacity: 0.7;
}

.date-bottom {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.date-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading);
}

.date-header.is-today .date-number {
  color: #42a5f5;
}

.date-month {
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-text);
  opacity: 0.6;
}
</style>
