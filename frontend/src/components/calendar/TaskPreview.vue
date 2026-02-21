<script setup lang="ts">
import type { HousekeepingTask } from '../../types'
import { getTaskTypeIcon, getTaskStatusClass } from '../../utils/taskHelpers'

type PreviewType = 'drag' | 'move' | 'resize'

interface Props {
  task: HousekeepingTask
  type: PreviewType
  style?: Record<string, string | number>
  title?: string
}

const props = defineProps<Props>()

const getPreviewClass = (): string => {
  const classes: Record<PreviewType, string> = {
    drag: 'task-drag-preview',
    move: 'task-pending-move',
    resize: 'task-resize-preview'
  }
  return classes[props.type]
}
</script>

<template>
  <div
    class="task-block"
    :class="[getPreviewClass(), getTaskStatusClass(task.status)]"
    :style="style"
    :title="title"
  >
    <div class="task-content">
      <div v-if="type === 'drag'" class="task-header">
        <span class="task-icon">{{ getTaskTypeIcon(task.taskType) }}</span>
        <span class="task-staff">{{ task.assignedUserName }}</span>
      </div>
      <div v-else class="task-header">
        <span class="task-icon">{{ getTaskTypeIcon(task.taskType) }}</span>
        <span class="task-staff">{{ task.assignedUserName || task.id }}</span>
      </div>
      <div v-if="type === 'drag'" class="task-type">{{ task.taskType }}</div>
    </div>
  </div>
</template>

<style scoped>
.task-block {
  position: absolute;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.task-drag-preview {
  opacity: 0.8;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(0, 0, 0, 0.3);
}

.task-pending-move {
  z-index: 10;
  opacity: 0.6;
  border: 2px dashed #2196f3;
  animation: pulse 1.5s ease-in-out infinite;
}

.task-resize-preview {
  z-index: 15;
  opacity: 0.7;
  border: 2px dashed #ff9800;
  pointer-events: none;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  height: 100%;
  overflow: hidden;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.task-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.task-staff {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.task-type {
  font-size: 0.75rem;
  text-transform: capitalize;
  opacity: 0.8;
}

.task-pending {
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
  color: #000;
}

.task-in-progress {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: #fff;
}

.task-completed {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: #fff;
}

.task-cancelled {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  color: #fff;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
