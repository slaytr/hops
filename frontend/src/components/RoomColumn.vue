<script setup lang="ts">
interface Room {
  id: string
  roomNumber: string
  roomType?: {
    name: string
  }
  floor?: number
}

interface Props {
  rooms: Room[]
  currentYear: number | string
  getRowHeight: (roomId: string) => string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="room-column">
    <div class="room-header">
      <div class="room-header-text">{{ currentYear }}</div>
    </div>
    <div
      v-for="room in rooms"
      :key="room.id"
      class="room-cell"
      :style="{
        height: getRowHeight(room.id),
        minHeight: getRowHeight(room.id),
        background: 'rgba(248, 248, 250, 1)'
      }"
    >
      <div class="room-number">{{ room.roomNumber }}</div>
      <div class="room-type">{{ room.roomType?.name }}</div>
    </div>
  </div>
</template>

<style scoped>
.room-column {
  position: sticky;
  left: 0;
  z-index: 20;
  background: var(--color-background);
  border-right: 2px solid var(--color-border);
  flex-shrink: 0;
  width: 120px;
}

.room-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid var(--color-border);
  background: var(--color-background-soft);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.room-header-text {
  color: var(--color-heading);
  font-size: 0.85rem;
  font-weight: 700;
}

.room-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  gap: 0.1rem;
}

.room-number {
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--color-heading);
  line-height: 1.1;
}

.room-type {
  font-size: 0.6rem;
  color: var(--color-text);
  opacity: 0.7;
  font-weight: 500;
  line-height: 1.1;
}

</style>
