import { ref } from 'vue'
import type { HousekeepingTask } from '../types'

interface ResizePreview {
  task: HousekeepingTask
  newTaskDate: string
  newDuration: number
}

export function useTaskResize(
  formatDateISO: (date: Date) => string
) {
  const resizingTask = ref<HousekeepingTask | null>(null)
  const resizeEdge = ref<'start' | 'end' | null>(null)
  const resizePreview = ref<ResizePreview | null>(null)

  const handleResizeStart = (event: MouseEvent, task: HousekeepingTask, edge: 'start' | 'end') => {
    event.stopPropagation()
    event.preventDefault()

    resizingTask.value = task
    resizeEdge.value = edge

    // Disable task dragging while resizing
    const target = event.target as HTMLElement
    const taskBlock = target.closest('.task-block') as HTMLElement
    if (taskBlock) {
      taskBlock.setAttribute('draggable', 'false')
    }
  }

  const handleResizeMove = (event: MouseEvent, date: Date) => {
    if (!resizingTask.value || !resizeEdge.value) return

    const newDateStr = formatDateISO(date)
    const task = resizingTask.value

    if (resizeEdge.value === 'end') {
      // Right edge: change duration
      const taskStart = new Date(task.taskDate + 'T00:00:00')
      const targetDate = new Date(newDateStr + 'T00:00:00')
      const daysDiff = Math.round((targetDate.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
      const newDuration = Math.max(1, daysDiff + 1)

      resizePreview.value = {
        task,
        newTaskDate: task.taskDate,
        newDuration
      }
    } else {
      // Left edge: change taskDate and adjust duration
      const taskStart = new Date(task.taskDate + 'T00:00:00')
      const taskEnd = new Date(taskStart)
      taskEnd.setDate(taskEnd.getDate() + (task.duration || 1) - 1)

      const targetDate = new Date(newDateStr + 'T00:00:00')
      if (targetDate > taskEnd) return // Can't move start past end

      const newDuration = Math.round((taskEnd.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      if (newDuration < 1) return

      resizePreview.value = {
        task,
        newTaskDate: newDateStr,
        newDuration
      }
    }
  }

  const cancelResize = () => {
    resizingTask.value = null
    resizeEdge.value = null
    resizePreview.value = null
  }

  return {
    resizingTask,
    resizeEdge,
    resizePreview,
    handleResizeStart,
    handleResizeMove,
    cancelResize
  }
}
