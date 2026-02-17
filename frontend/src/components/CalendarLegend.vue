<script setup lang="ts">
// No props or emits needed - pure presentation component
</script>

<template>
  <div class="calendar-legend">
    <h3>Legend</h3>
    <div class="legend-items">
      <div class="legend-item">
        <span class="legend-box task-pending"></span>
        <span>Pending</span>
      </div>
      <div class="legend-item">
        <span class="legend-box task-in-progress"></span>
        <span>In Progress</span>
      </div>
      <div class="legend-item">
        <span class="legend-box task-completed"></span>
        <span>Completed</span>
      </div>
      <div class="legend-item">
        <span class="legend-box task-cancelled"></span>
        <span>Cancelled</span>
      </div>
    </div>
    <div class="legend-items">
      <div class="legend-item">
        <span>🧹</span> Cleaning
      </div>
      <div class="legend-item">
        <span>🔧</span> Maintenance
      </div>
      <div class="legend-item">
        <span>🔍</span> Inspection
      </div>
      <div class="legend-item">
        <span>🛏️</span> Turndown
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-legend {
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.calendar-legend h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.legend-items {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.legend-items:last-child {
  margin-bottom: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.legend-box {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.task-pending {
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
}

.task-in-progress {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.task-completed {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.task-cancelled {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
}
</style>
