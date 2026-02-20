<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, defineAsyncComponent } from 'vue'
import { useOpsHubSettings } from '../composables/useOpsHubSettings'
import { useTaskCalculations } from '../composables/useTaskCalculations'
import { useTaskStacking } from '../composables/useTaskStacking'
import { useTaskResize } from '../composables/useTaskResize'
import { useDragAndDrop } from '../composables/useDragAndDrop'
import { fetchRooms as apiFetchRooms } from '../api/rooms'
import { fetchTasks as apiFetchTasks, updateTask, createTask as apiCreateTask } from '../api/tasks'
import { fetchStaff as apiFetchStaff } from '../api/staff'
import { formatDateDisplay, getDayName, getMonthAbbr, isToday, isWeekend } from '../utils/dateFormatters'
import TaskBlock from './TaskBlock.vue'
import TaskPreview from './TaskPreview.vue'
import MoveConfirmButtons from './MoveConfirmButtons.vue'
import CalendarHeader from './CalendarHeader.vue'
import CalendarControls from './CalendarControls.vue'
import TaskActions from './TaskActions.vue'
import CalendarLegend from './CalendarLegend.vue'
import RoomColumn from './RoomColumn.vue'
import DateHeader from './DateHeader.vue'

// Lazy load heavy modal component
const AddTaskModal = defineAsyncComponent(() => import('./AddTaskModal.vue'))

const { roomSortBy } = useOpsHubSettings()

interface HousekeepingTask {
  id: string
  roomId: string
  roomNumber?: string
  assignedUserId?: string
  assignedUserName?: string
  taskDate: string
  duration: number
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  startedAt?: string
  completedAt?: string
}

interface Room {
  id: string
  roomNumber: string
  roomTypeId: string
  roomType?: {
    name: string
  }
  floor?: number
  status: string
}

interface Staff {
  id: string
  firstName: string
  lastName: string
  role: string
  status: string
}

const rooms = ref<Room[]>([])
const tasks = ref<HousekeepingTask[]>([])
const loading = ref(false)
const error = ref('')

// Initialize composables
const taskCalc = useTaskCalculations(tasks)
const {
  getTaskDateRange,
  getTaskWidth,
  isMultiDayTask,
  formatDateISO,
  getTasksInCell,
  taskStartsOnDate,
  DATE_COLUMN_WIDTH: DATE_COL_WIDTH
} = taskCalc

const taskStacking = useTaskStacking(tasks, getTasksInCell, getTaskDateRange)
const {
  calculateTaskTracks,
  getTaskVerticalOffset,
  calculateRowHeights: calcRowHeights,
  TASK_HEIGHT: TASK_H,
  TASK_SPACING: TASK_S
} = taskStacking

const taskResize = useTaskResize(formatDateISO)
const {
  resizingTask,
  resizeEdge,
  resizePreview,
  handleResizeStart,
  handleResizeMove: handleResizeMoveFromComposable,
  cancelResize
} = taskResize

const dragAndDrop = useDragAndDrop(formatDateISO)
const {
  draggedTask,
  draggedFromDate,
  draggedTaskWidth,
  dragPreview,
  pendingMove,
  handleDragStart,
  handleDragEnterCell,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  cancelMove
} = dragAndDrop

// Date range controls
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const startDate = ref(yesterday)
const daysToShow = ref(7)
const containerWidth = ref(0)

// Fixed column widths (must match CSS)
const ROOM_COLUMN_WIDTH = 100
const DATE_COLUMN_WIDTH = DATE_COL_WIDTH

// Use constants from composables
const TASK_HEIGHT = TASK_H
const TASK_SPACING = TASK_S
const BASE_ROW_HEIGHT = 34 // px - fits 1 task
const TASKS_BEFORE_EXPAND = 1 // number of tasks that fit before row expands

// Filter controls
const statusFilter = ref<string>('all')

// Calendar view type
const calendarViewType = ref<'tasklist' | 'calendar'>('tasklist')

// Add task modal
const showAddTaskModal = ref(false)
const staff = ref<Staff[]>([])

const dates = computed(() => {
  const dateArray: Date[] = []
  const totalDays = daysToShow.value

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate.value)
    date.setDate(date.getDate() + i)
    dateArray.push(date)
  }
  return dateArray
})

const filteredRooms = computed(() => {
  let filtered = [...rooms.value]

  if (roomSortBy.value === 'roomType') {
    filtered.sort((a, b) => {
      const typeA = a.roomType?.name || ''
      const typeB = b.roomType?.name || ''
      if (typeA !== typeB) return typeA.localeCompare(typeB)
      return (parseInt(a.roomNumber) || 0) - (parseInt(b.roomNumber) || 0)
    })
  } else {
    filtered.sort((a, b) => {
      return (parseInt(a.roomNumber) || 0) - (parseInt(b.roomNumber) || 0)
    })
  }

  return filtered
})

// Assign alternating background colors to room types when sorted by type
const getRoomTypeBackground = (room: Room): string => {
  if (roomSortBy.value !== 'roomType') return 'rgba(255, 255, 255, 1)'

  const roomTypeColorMap = new Map<string, number>()
  let colorIndex = 0

  for (const r of filteredRooms.value) {
    const typeName = r.roomType?.name || 'Unknown'
    if (!roomTypeColorMap.has(typeName)) {
      roomTypeColorMap.set(typeName, colorIndex)
      colorIndex++
    }
  }

  const typeName = room.roomType?.name || 'Unknown'
  const index = roomTypeColorMap.get(typeName) || 0

  const colors = [
    'rgba(248, 248, 250, 1)',
    'rgba(255, 255, 255, 1)',
  ]

  return colors[index % colors.length] as string
}

const datesSectionWidth = computed(() => {
  return daysToShow.value * DATE_COLUMN_WIDTH
})

const currentYear = computed(() => {
  return startDate.value.getFullYear()
})

// Calculate row height based on maximum task stacking
const rowHeights = computed(() => {
  const heights = new Map<string, number>()

  for (const room of filteredRooms.value) {
    let maxTracks = 0

    for (const date of dates.value) {
      const cellTasks = getTasksInCell(room.id, date)
      if (cellTasks.length > 0) {
        const tracks = calculateTaskTracks(cellTasks, date)
        maxTracks = Math.max(maxTracks, tracks.size)
      }
    }

    const height = maxTracks > TASKS_BEFORE_EXPAND
      ? BASE_ROW_HEIGHT + ((maxTracks - TASKS_BEFORE_EXPAND) * (TASK_HEIGHT + TASK_SPACING))
      : BASE_ROW_HEIGHT

    heights.set(room.id, height)
  }

  return heights
})

const getRowHeight = (roomId: string): string => {
  return `${rowHeights.value.get(roomId) || BASE_ROW_HEIGHT}px`
}

const fetchRoomsData = async () => {
  try {
    rooms.value = await apiFetchRooms()
  } catch (e) {
    error.value = 'Failed to fetch rooms'
  }
}

const fetchTasksData = async () => {
  try {
    const rangeStart = formatDateISO(dates.value[0] as Date)
    const rangeEnd = formatDateISO(dates.value[dates.value.length - 1] as Date)

    const fetchedTasks = await apiFetchTasks(rangeStart, rangeEnd)
    // Ensure duration defaults to 1 for any tasks that don't have it
    tasks.value = fetchedTasks.map(t => ({
      ...t,
      duration: t.duration || 1
    }))
  } catch (e) {
    error.value = 'Failed to fetch tasks'
  }
}

const fetchStaffData = async () => {
  try {
    staff.value = await apiFetchStaff()
  } catch (e) {
    console.error('Failed to fetch staff:', e)
  }
}

const initialTaskData = computed(() => {
  const today = new Date()
  return {
    taskType: 'cleaning' as const,
    roomId: '',
    staffId: '',
    taskDate: formatDateISO(today),
    duration: 1
  }
})

const openAddTaskModal = () => {
  showAddTaskModal.value = true
  fetchStaffData()
}

const closeAddTaskModal = () => {
  showAddTaskModal.value = false
}

const createTask = async (taskData: { taskType: string; roomId: string; staffId: string; taskDate: string; duration: number }) => {
  try {
    const payload: any = {
      taskType: taskData.taskType,
      priority: 'medium',
      status: 'pending'
    }

    if (taskData.roomId) {
      payload.roomId = taskData.roomId
    }

    if (taskData.staffId) {
      payload.staffId = taskData.staffId
    }

    if (taskData.taskDate) {
      payload.taskDate = taskData.taskDate
    }

    if (taskData.duration && taskData.duration > 1) {
      payload.duration = taskData.duration
    }

    await apiCreateTask(payload)
    await fetchTasksData()
    closeAddTaskModal()
  } catch (e: any) {
    console.error('Failed to create task:', e)
    error.value = e.message || 'Failed to create task'
  }
}

// Only render tasks on their START date (to avoid duplicates for multi-day tasks)
const getTasksStartingOnDate = (roomId: string, date: Date): HousekeepingTask[] => {
  const dateStr = formatDateISO(date)
  const firstVisibleDate = dates.value[0] ? formatDateISO(dates.value[0]) : dateStr

  let roomTasks = tasks.value.filter(t => {
    if (t.roomId !== roomId) return false

    // Case 1: Task starts on this date
    if (taskStartsOnDate(t, date)) return true

    // Case 2: Task started before visible range but is active on this date
    // Only render on the first visible date to avoid duplicates
    if (dateStr === firstVisibleDate) {
      const taskStart = t.taskDate
      const duration = t.duration || 1
      const taskEndDate = new Date(taskStart + 'T00:00:00')
      taskEndDate.setDate(taskEndDate.getDate() + duration - 1)
      const taskEnd = formatDateISO(taskEndDate)

      return taskStart < firstVisibleDate && taskEnd >= firstVisibleDate
    }

    return false
  })

  if (statusFilter.value !== 'all') {
    roomTasks = roomTasks.filter(t => t.status === statusFilter.value)
  }

  return roomTasks
}


const getTaskStyle = (task: HousekeepingTask, roomId: string, startDate: Date): Record<string, string | number> => {
  const width = getTaskWidth(task)
  const verticalOffset = getTaskVerticalOffset(task, roomId, startDate)

  return {
    position: 'absolute',
    width: `${width}px`,
    left: '0px',
    top: `${verticalOffset}px`,
    zIndex: isMultiDayTask(task) ? 2 : 1,
    height: `${TASK_HEIGHT}px`
  }
}

const getTaskDurationDisplay = (task: HousekeepingTask): string => {
  const duration = task.duration || 1
  return `${duration} ${duration === 1 ? 'day' : 'days'}`
}

const isTodayInVisibleRange = (date: Date): boolean => {
  return isToday(date)
}

const getStaffInitials = (name: string | undefined): string => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getTaskTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    cleaning: '🧹',
    maintenance: '🔧',
    inspection: '🔍',
    turndown: '🛏️'
  }
  return icons[type] || '📋'
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'task-pending',
    in_progress: 'task-in-progress',
    completed: 'task-completed',
    cancelled: 'task-cancelled'
  }
  return classes[status] || ''
}

const navigateDays = (offset: number) => {
  const newDate = new Date(startDate.value)
  newDate.setDate(newDate.getDate() + offset)
  startDate.value = newDate
}

const goToToday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  startDate.value = yesterday
}

const selectView = (viewType: 'tasklist' | 'calendar') => {
  calendarViewType.value = viewType
}

const handleDateChange = (date: Date) => {
  startDate.value = date
}

const changeDaysToShow = (days: number) => {
  daysToShow.value = days
}

const calculateDaysToShow = (width: number): number => {
  const availableWidth = width - ROOM_COLUMN_WIDTH
  const maxDays = Math.floor(availableWidth / DATE_COLUMN_WIDTH)
  return Math.max(3, Math.min(30, maxDays))
}

const updateContainerWidth = () => {
  const container = document.querySelector('.calendar-container')
  if (container && container.parentElement) {
    const width = container.parentElement.clientWidth
    containerWidth.value = width
    daysToShow.value = calculateDaysToShow(width)
  }
}

const handleResizeEnd = async () => {
  if (!resizingTask.value || !resizePreview.value) {
    cancelResize()
    return
  }

  loading.value = true
  error.value = ''

  try {
    await updateTask(resizingTask.value.id, {
      taskDate: resizePreview.value.newTaskDate,
      duration: resizePreview.value.newDuration
    })
    await fetchTasksData()
  } catch (e: any) {
    error.value = e.message || 'Failed to resize task'
  } finally {
    loading.value = false
    cancelResize()
  }
}

const handleMoveConfirm = async () => {
  if (!pendingMove.value) { cancelMove(); return }

  loading.value = true
  error.value = ''
  try {
    const payload: Record<string, any> = {
      taskDate: pendingMove.value.newTaskDate
    }
    if (pendingMove.value.newRoomId && pendingMove.value.newRoomId !== pendingMove.value.task.roomId) {
      payload.roomId = pendingMove.value.newRoomId
    }
    await updateTask(pendingMove.value.task.id, payload)
    await fetchTasksData()
  } catch (e: any) {
    error.value = e.message || 'Failed to move task'
  } finally {
    loading.value = false
    cancelMove()
  }
}

const getMoveConfirmPosition = () => ({
  top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
})

const getResizePreviewWidth = (preview: typeof resizePreview.value) => {
  if (!preview) return DATE_COLUMN_WIDTH
  return DATE_COLUMN_WIDTH * preview.newDuration
}

// Wheel scroll handler for date navigation
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  const daysOffset = event.deltaY > 0 ? 1 : -1
  const newDate = new Date(startDate.value)
  newDate.setDate(newDate.getDate() + daysOffset)
  startDate.value = newDate
}


onMounted(async () => {
  loading.value = true
  await Promise.all([fetchRoomsData(), fetchTasksData()])
  loading.value = false

  await nextTick()
  updateContainerWidth()

  window.addEventListener('resize', updateContainerWidth)
  window.addEventListener('mouseup', handleResizeEnd)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  window.removeEventListener('mouseup', handleResizeEnd)
  handleDragEnd()
})
</script>

<template>
  <div class="calendar-view">
    <CalendarHeader
      :view-type="calendarViewType"
      @select-view="selectView"
    />

    <CalendarControls
      :days-to-show="daysToShow"
      @navigate-days="navigateDays"
      @go-to-today="goToToday"
      @date-change="handleDateChange"
    />

    <TaskActions
      :room-sort-by="roomSortBy"
      @add-task="openAddTaskModal"
      @update-sort="(sortBy) => roomSortBy = sortBy"
    />

    <div v-if="loading" class="loading">Loading calendar...</div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!loading && filteredRooms.length > 0" class="calendar-container">
      <div class="calendar-grid">
        <!-- Fixed room column -->
        <RoomColumn
          :rooms="filteredRooms"
          :current-year="currentYear"
          :get-row-height="getRowHeight"
        />

        <!-- Scrolling date columns -->
        <Transition name="" mode="out-in">
          <div class="dates-section" :key="startDate.toISOString()" :style="{ width: `${datesSectionWidth}px` }">
            <!-- Date headers -->
            <DateHeader
              :dates="dates"
              :get-day-name="getDayName"
              :get-month-abbr="getMonthAbbr"
              :is-today-in-visible-range="isTodayInVisibleRange"
              :is-weekend="isWeekend"
              @wheel="handleWheel"
            />

            <!-- Date cells for each room -->
            <div
              v-for="room in filteredRooms"
              :key="room.id"
              class="dates-row"
              :style="{
                height: getRowHeight(room.id),
                minHeight: getRowHeight(room.id),
                background: getRoomTypeBackground(room)
              }"
            >
              <div
                v-for="date in dates"
                :key="`${room.id}-${date.toISOString()}`"
                class="date-cell"
                :class="{ 'is-today': isTodayInVisibleRange(date), 'is-weekend': isWeekend(date) }"
                @drop="(e: DragEvent) => handleDrop(e, date)"
                @dragover.prevent="handleDragOver"
                @mouseenter="(e) => { if (resizingTask) handleResizeMoveFromComposable(e as MouseEvent, date) }"
                @dragenter.prevent="() => { if (draggedTask) handleDragEnterCell(date, room.id) }"
              >
                <!-- Regular tasks -->
            <TaskBlock
              v-for="task in getTasksStartingOnDate(room.id, date)"
              :key="task.id"
              :task="task"
              :style="getTaskStyle(task, room.id, date)"
              :is-multi-day="isMultiDayTask(task)"
              :is-resizing="resizingTask?.id === task.id"
              :is-dragging="draggedTask?.id === task.id"
              :draggable="!resizingTask && !pendingMove"
              @dragstart="(e: DragEvent) => handleDragStart(e, task, date)"
              @dragend="handleDragEnd"
              @resize-start="(e: MouseEvent, edge: 'start' | 'end') => handleResizeStart(e, task, edge)"
            />

            <!-- Resize preview overlay -->
            <TaskPreview
              v-if="resizePreview && resizePreview.task.roomId === room.id && formatDateISO(date) === resizePreview.newTaskDate"
              :task="resizePreview.task"
              type="resize"
              :style="{
                position: 'absolute',
                width: `${getResizePreviewWidth(resizePreview)}px`,
                zIndex: 15,
                minHeight: '2.5rem',
                pointerEvents: 'none'
              }"
            />

            <!-- Drag preview overlay (ghost at target location) -->
            <TaskPreview
              v-if="dragPreview && dragPreview.roomId === room.id && formatDateISO(date) === formatDateISO(dragPreview.targetDate)"
              :task="dragPreview.task"
              type="drag"
              :style="{
                position: 'absolute',
                width: `${draggedTaskWidth}px`,
                left: '0px',
                top: '0px',
                zIndex: 10,
                height: `${TASK_HEIGHT}px`,
                pointerEvents: 'none'
              }"
            />

            <!-- Pending move preview (pulsing, awaiting confirmation) -->
            <TaskPreview
              v-if="pendingMove && pendingMove.newRoomId === room.id && formatDateISO(date) === pendingMove.toDate"
              :task="pendingMove.task"
              type="move"
              :style="{
                position: 'absolute',
                width: `${DATE_COLUMN_WIDTH * (pendingMove.task.duration || 1)}px`,
                left: '0px',
                top: '0px',
                zIndex: 11,
                height: `${TASK_HEIGHT}px`,
                pointerEvents: 'none'
              }"
            />

              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <p>No rooms available. Add rooms to see the calendar.</p>
    </div>

    <!-- Legend -->
    <CalendarLegend />

    <!-- Move Confirm Buttons -->
    <MoveConfirmButtons
      v-if="pendingMove"
      :position="getMoveConfirmPosition()"
      :loading="loading"
      @confirm="handleMoveConfirm"
      @cancel="cancelMove"
    />

    <!-- Add Task Modal -->
    <AddTaskModal
      :show="showAddTaskModal"
      :rooms="filteredRooms"
      :staff="staff"
      :initial-task="initialTaskData"
      @close="closeAddTaskModal"
      @create="createTask"
    />
  </div>
</template>

<style scoped>
.calendar-view {
  width: 100%;
  padding: 0.75rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--color-text);
  opacity: 0.7;
}

.error {
  color: #e53935;
  padding: 1rem;
  background: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
  margin-bottom: 1rem;
}

.calendar-container {
  background: var(--color-background-soft);
  border-radius: 0 0 8px 8px;
  border: 1px solid var(--color-border);
  border-top: none;
  overflow-x: hidden;
  overflow-y: visible;
  margin: 0 auto 2rem;
  width: fit-content;
  max-width: 100%;
  position: relative;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 100px auto;
  width: 100%;
  background: var(--color-background);
  overflow: visible;
}


.dates-section {
  display: grid;
  grid-template-rows: auto;
  overflow-x: visible;
  background: var(--color-background);
  position: relative;
}


.dates-row {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  align-items: flex-start;
  overflow: visible;
  position: relative;
  transition: height 0.2s ease;
}


.date-cell {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  padding: 0;
  border-right: 1px solid var(--color-border);
  height: 100%;
  overflow: visible;
  position: relative;
}

.date-cell:last-child {
  border-right: none;
}

.date-cell.is-weekend {
  background: rgba(255, 152, 0, 0.05);
}

.date-cell.is-today {
  position: relative;
  background: rgba(174, 207, 242, 0.25) !important;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text);
  opacity: 0.7;
}
</style>
