<script setup lang="ts">
import type { HousekeepingTask } from '../../types'
import { getTaskTypeIcon, getTaskStatusClass } from '../../utils/taskHelpers'

interface Props {
  task: HousekeepingTask
  style?: Record<string, string | number>
  isMultiDay?: boolean
  isResizing?: boolean
  isDragging?: boolean
}

interface Emits {
  (e: 'resize-start', event: MouseEvent, edge: 'start' | 'end'): void
  (e: 'mouseenter', event: MouseEvent): void
  (e: 'mouseleave', event: MouseEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleResizeStart = (event: MouseEvent, edge: 'start' | 'end') => {
  emit('resize-start', event, edge)
}

const handleMouseEnter = (event: MouseEvent) => {
  // Show resize handles
  const target = event.currentTarget as HTMLElement
  target.querySelectorAll('.resize-handle').forEach(h => (h as HTMLElement).style.opacity = '1')
  emit('mouseenter', event)
}

const handleMouseLeave = (event: MouseEvent) => {
  // Hide resize handles
  const target = event.currentTarget as HTMLElement
  target.querySelectorAll('.resize-handle').forEach(h => (h as HTMLElement).style.opacity = '0')
  emit('mouseleave', event)
}
</script>

<template>
  <div
    class="task-block"
    :class="[
      getTaskStatusClass(task.status),
      {
        'multi-day': isMultiDay,
        'resizing': isResizing,
        'dragging': isDragging
      }
    ]"
    :style="style"
    :title="`${task.assignedUserName} - ${task.taskType} - ${task.status}`"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Left resize handle -->
    <div
      class="resize-handle resize-handle-left"
      draggable="false"
      @mousedown.stop="(e) => handleResizeStart(e, 'start')"
      @mouseenter="(e) => e.stopPropagation()"
    ></div>

    <div class="task-content">
      <span class="task-icon">{{ getTaskTypeIcon(task.taskType) }}</span>
      <span class="task-staff">{{ task.assignedUserName || task.id }}</span>
    </div>

    <!-- Right resize handle -->
    <div
      class="resize-handle resize-handle-right"
      draggable="false"
      @mousedown.stop="(e) => handleResizeStart(e, 'end')"
      @mouseenter="(e) => e.stopPropagation()"
    ></div>
  </div>
</template>

<style scoped>
.task-block {
  padding: 0 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-left: 2px solid transparent;
  border-right: 2px solid transparent;
  line-height: 28px;
  margin: 1px 0;
  pointer-events: all;
  z-index: 1;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(0, 0, 0, 0.1);
}

.resize-handle-left {
  left: 0;
  border-left: 2px solid transparent;
}

.resize-handle-left:hover {
  border-left-color: var(--color-primary);
}

.resize-handle-right {
  right: 0;
  border-right: 2px solid transparent;
}

.resize-handle-right:hover {
  border-right-color: var(--color-primary);
}

.task-block.resizing {
  opacity: 0.6;
  cursor: ew-resize;
}

.task-block.resizing .resize-handle {
  opacity: 1;
}

.task-block.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.task-block:hover {
  transform: scale(1.02);
  z-index: 2;
  position: relative;
}


.task-pending {
  background: linear-gradient(135deg, rgba(248, 248, 250, 1) 0%, rgba(229, 231, 235, 1) 100%);
  border-left-color: var(--status-pending);
  border-right-color: var(--status-pending);
  color: var(--color-text);
}

.task-in-progress {
  background: linear-gradient(135deg, var(--status-in-progress-bg) 0%, rgba(66, 165, 245, 1) 100%);
  border-left-color: var(--status-in-progress);
  border-right-color: var(--status-in-progress);
  color: var(--status-in-progress);
}

.task-completed {
  background: linear-gradient(135deg, var(--status-completed-bg) 0%, rgba(102, 187, 106, 1) 100%);
  border-left-color: var(--status-completed);
  border-right-color: var(--status-completed);
  color: var(--status-completed);
}

.task-cancelled {
  background: linear-gradient(135deg, var(--status-cancelled-bg) 0%, rgba(239, 83, 80, 1) 100%);
  border-left-color: var(--status-cancelled);
  border-right-color: var(--status-cancelled);
  color: var(--status-cancelled);
}

.task-content {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  overflow: hidden;
  height: 100%;
}

.task-icon {
  font-size: 0.7rem;
  flex-shrink: 0;
  line-height: 1;
}

.task-staff {
  font-weight: 600;
  font-size: 0.7rem;
  white-space: nowrap;
  flex: 1;
  line-height: 1;
}
</style>
