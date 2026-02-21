import { ref } from 'vue'
import type { HousekeepingTask } from '../types'

interface DragPreview {
  task: HousekeepingTask
  targetDate: Date
  roomId: string
}

interface PendingMove {
  task: HousekeepingTask
  fromDate: string
  toDate: string
  newTaskDate: string
  newRoomId?: string
}

export function useDragAndDrop(
  formatDateISO: (date: Date) => string
) {
  const draggedTask = ref<HousekeepingTask | null>(null)
  const draggedFromDate = ref<string | null>(null)
  const draggedTaskWidth = ref<number>(0)
  const dragPreview = ref<DragPreview | null>(null)
  const pendingMove = ref<PendingMove | null>(null)

  // Auto-scroll state
  let autoScrollInterval: number | null = null
  const SCROLL_ZONE = 100
  const SCROLL_SPEED = 10

  const handleDragStart = (event: DragEvent, task: HousekeepingTask, date: Date) => {
    if (pendingMove.value) return

    const target = event.target as HTMLElement
    draggedTaskWidth.value = target.offsetWidth

    draggedTask.value = task
    draggedFromDate.value = formatDateISO(date)
    dragPreview.value = null

    document.addEventListener('drag', handleDragMove)
  }

  const handleDragMove = (event: DragEvent) => {
    if (!draggedTask.value || event.clientX === 0) return

    const viewportWidth = window.innerWidth
    const mouseX = event.clientX

    const nearLeft = mouseX < SCROLL_ZONE
    const nearRight = mouseX > viewportWidth - SCROLL_ZONE

    if (nearLeft || nearRight) {
      startAutoScroll(nearLeft ? -1 : 1)
    } else {
      stopAutoScroll()
    }
  }

  const startAutoScroll = (_direction: number) => {
    // Auto-scroll disabled: dates-section uses Vue transitions (startDate ref change),
    // not CSS scroll/transform. Revisit with a navigateDays callback if needed.
  }

  const stopAutoScroll = () => {
    if (autoScrollInterval !== null) {
      clearInterval(autoScrollInterval)
      autoScrollInterval = null
    }
  }

  const handleDragEnterCell = (date: Date, roomId: string) => {
    if (!draggedTask.value || !draggedFromDate.value) return

    dragPreview.value = {
      task: draggedTask.value,
      targetDate: date,
      roomId
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: DragEvent, date: Date) => {
    event.preventDefault()

    if (!draggedTask.value || !draggedFromDate.value) return

    const newDate = formatDateISO(date)

    pendingMove.value = {
      task: draggedTask.value,
      fromDate: draggedFromDate.value,
      toDate: newDate,
      newTaskDate: newDate,
      newRoomId: dragPreview.value?.roomId ?? draggedTask.value.roomId
    }

    draggedTask.value = null
    draggedFromDate.value = null
    dragPreview.value = null
  }

  const handleDragEnd = () => {
    document.removeEventListener('drag', handleDragMove)
    stopAutoScroll()

    if (!pendingMove.value) {
      draggedTask.value = null
      draggedFromDate.value = null
      dragPreview.value = null
    }
  }

  const cancelMove = () => {
    pendingMove.value = null
  }

  return {
    draggedTask,
    draggedFromDate,
    draggedTaskWidth,
    dragPreview,
    pendingMove,
    handleDragStart,
    handleDragMove,
    handleDragEnterCell,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    cancelMove
  }
}
