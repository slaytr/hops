<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'

const API_URL = 'http://localhost:3000'

interface HousekeepingTask {
  id: string
  roomId: string
  roomNumber?: string
  assignedUserId: string
  assignedUserName?: string
  taskDate: string
  startDateTime?: string
  endDateTime?: string
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
  roomTypeName?: string
  floor?: number
  status: string
}

const rooms = ref<Room[]>([])
const tasks = ref<HousekeepingTask[]>([])
const loading = ref(false)
const error = ref('')

// Date range controls
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const startDate = ref(yesterday)
const daysToShow = ref(7)
const containerWidth = ref(0)

// Fixed column widths (must match CSS)
const ROOM_COLUMN_WIDTH = 100
const DATE_COLUMN_WIDTH = 100

// Drag and drop state
const draggedTask = ref<HousekeepingTask | null>(null)
const draggedFromDate = ref<string | null>(null)
const pendingMove = ref<{
  task: HousekeepingTask
  fromDate: string
  toDate: string
  newStartDateTime: string
  newEndDateTime: string
} | null>(null)

// Header drag state
const isDraggingHeader = ref(false)
const dragStartX = ref(0)
const dragTranslateX = ref(0)
const justDropped = ref(false)
const isScrolling = ref(false)
const scrollTargetOffset = ref(0)
const BUFFER_DAYS = 15 // Extra days to render on each side for smooth scrolling
const SCROLL_DURATION = 300 // milliseconds for button scroll animation

// Filter controls
const statusFilter = ref<string>('all')
const searchExpanded = ref(false)
const searchCollapsing = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const datePickerInput = ref<HTMLInputElement | null>(null)

// Calendar view type
const calendarViewType = ref<'tasklist' | 'calendar'>('tasklist')
const viewDropdownOpen = ref(false)

const dates = computed(() => {
  const dateArray: Date[] = []
  // Include buffer days before and after for smooth scrolling
  const needsBuffer = isDraggingHeader.value || isScrolling.value
  const totalDays = needsBuffer ? daysToShow.value + (BUFFER_DAYS * 2) : daysToShow.value
  const startOffset = needsBuffer ? -BUFFER_DAYS : 0

  for (let i = startOffset; i < startOffset + totalDays; i++) {
    const date = new Date(startDate.value)
    date.setDate(date.getDate() + i)
    dateArray.push(date)
  }
  return dateArray
})

const filteredRooms = computed(() => {
  let filtered = [...rooms.value]

  // Sort by room number
  filtered.sort((a, b) => {
    const numA = parseInt(a.roomNumber) || 0
    const numB = parseInt(b.roomNumber) || 0
    return numA - numB
  })

  return filtered
})

const datesSectionTransform = computed(() => {
  const bufferOffset = BUFFER_DAYS * DATE_COLUMN_WIDTH

  if (isDraggingHeader.value) {
    // When dragging, offset by buffer amount + drag distance
    const totalOffset = -bufferOffset + dragTranslateX.value
    return `translateX(${totalOffset}px)`
  }

  if (isScrolling.value) {
    // When scrolling via buttons, animate to target offset
    const totalOffset = -bufferOffset + scrollTargetOffset.value
    return `translateX(${totalOffset}px)`
  }

  return 'translateX(0)'
})

const datesSectionWidth = computed(() => {
  if (isDraggingHeader.value || isScrolling.value) {
    // Include buffer days when dragging or scrolling
    return (daysToShow.value + BUFFER_DAYS * 2) * DATE_COLUMN_WIDTH
  }
  return daysToShow.value * DATE_COLUMN_WIDTH
})

const currentYear = computed(() => {
  return startDate.value.getFullYear()
})

const fetchRooms = async () => {
  try {
    const response = await fetch(`${API_URL}/rooms`)
    const data = await response.json()
    rooms.value = data.rooms
  } catch (e) {
    error.value = 'Failed to fetch rooms'
  }
}

const fetchTasks = async () => {
  try {
    // Fetch all tasks in visible date range
    const rangeStart = formatDateISO(dates.value[0])
    const rangeEnd = formatDateISO(dates.value[dates.value.length - 1])

    const response = await fetch(
      `${API_URL}/housekeeping-tasks?startDate=${rangeStart}&endDate=${rangeEnd}`
    )
    const data = await response.json()
    tasks.value = data.tasks
  } catch (e) {
    error.value = 'Failed to fetch tasks'
  }
}

// Only render tasks on their START date (to avoid duplicates for multi-day tasks)
const getTasksStartingOnDate = (roomId: string, date: Date): HousekeepingTask[] => {
  let roomTasks = tasks.value.filter(t => {
    if (t.roomId !== roomId) return false
    return taskStartsOnDate(t, date)
  })

  if (statusFilter.value !== 'all') {
    roomTasks = roomTasks.filter(t => t.status === statusFilter.value)
  }

  return roomTasks
}

const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateHeader = (date: Date): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  if (compareDate.getTime() === today.getTime()) {
    return 'Today'
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

const getMonthAbbr = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const isToday = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate.getTime() === today.getTime()
}

// Multi-day task helper functions
const getTaskDateRange = (task: HousekeepingTask): Date[] => {
  const dates: Date[] = []
  const start = task.startDateTime
    ? new Date(task.startDateTime)
    : new Date(task.taskDate + 'T12:00:00')
  const end = task.endDateTime
    ? new Date(task.endDateTime)
    : new Date(task.taskDate + 'T23:59:59')

  let current = new Date(start)
  current.setHours(0, 0, 0, 0)

  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const isMultiDayTask = (task: HousekeepingTask): boolean => {
  if (!task.startDateTime || !task.endDateTime) return false
  const start = task.startDateTime.split('T')[0]
  const end = task.endDateTime.split('T')[0]
  return start !== end
}

const taskStartsOnDate = (task: HousekeepingTask, date: Date): boolean => {
  const dateStr = formatDateISO(date)
  const start = task.startDateTime
    ? task.startDateTime.split('T')[0]
    : task.taskDate
  return dateStr === start
}

const getTaskStyle = (task: HousekeepingTask) => {
  if (!isMultiDayTask(task)) {
    return {}
  }

  const dateRange = getTaskDateRange(task)
  const spanDays = dateRange.length
  const width = spanDays * DATE_COLUMN_WIDTH

  return {
    position: 'absolute',
    width: `${width}px`,
    zIndex: 10,
    minHeight: '2.5rem'
  }
}

const getTaskDurationDisplay = (task: HousekeepingTask): string => {
  const dateRange = getTaskDateRange(task)
  return `${dateRange.length} ${dateRange.length === 1 ? 'day' : 'days'}`
}

const isTodayInVisibleRange = (date: Date): boolean => {
  // Hide today highlight during button scrolling to prevent flash effect
  // But keep it visible during drag for orientation
  if (isScrolling.value) {
    return false
  }
  return isToday(date)
}

const getStaffInitials = (name: string | undefined): string => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
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

const getTaskTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    cleaning: '🧹',
    maintenance: '🔧',
    inspection: '🔍',
    turndown: '🛏️'
  }
  return icons[type] || '📋'
}

const navigateDays = (offset: number) => {
  // Navigate instantly without animation
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
  viewDropdownOpen.value = false
}

const toggleViewDropdown = () => {
  viewDropdownOpen.value = !viewDropdownOpen.value
}

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
    startDate.value = selectedDate
  }
}

const changeDaysToShow = (days: number) => {
  daysToShow.value = days
}

const calculateDaysToShow = (width: number): number => {
  // Calculate available width for date columns
  const availableWidth = width - ROOM_COLUMN_WIDTH

  // Calculate how many date columns can fit
  const maxDays = Math.floor(availableWidth / DATE_COLUMN_WIDTH)

  // Minimum 3 days, maximum 30 days
  return Math.max(3, Math.min(30, maxDays))
}

const updateContainerWidth = () => {
  const container = document.querySelector('.calendar-container')
  if (container) {
    const width = container.clientWidth
    containerWidth.value = width
    daysToShow.value = calculateDaysToShow(width)
  }
}

// Drag and drop handlers
const handleDragStart = (task: HousekeepingTask, date: Date) => {
  draggedTask.value = task
  draggedFromDate.value = formatDateISO(date)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent, date: Date) => {
  event.preventDefault()

  if (!draggedTask.value || !draggedFromDate.value) return

  const newDate = formatDateISO(date)

  // Don't create pending move if dropping on same date
  if (newDate === draggedFromDate.value) {
    draggedTask.value = null
    draggedFromDate.value = null
    return
  }

  // Calculate date offset
  const oldDate = new Date(draggedFromDate.value)
  const newStartDate = new Date(newDate)
  const daysDiff = Math.floor(
    (newStartDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // For multi-day tasks, shift both start and end by same offset
  let newStartDateTime: string
  let newEndDateTime: string

  if (draggedTask.value.startDateTime && draggedTask.value.endDateTime) {
    const oldStart = new Date(draggedTask.value.startDateTime)
    const oldEnd = new Date(draggedTask.value.endDateTime)

    oldStart.setDate(oldStart.getDate() + daysDiff)
    oldEnd.setDate(oldEnd.getDate() + daysDiff)

    newStartDateTime = oldStart.toISOString()
    newEndDateTime = oldEnd.toISOString()
  } else {
    // Single-day task: convert to new format
    newStartDateTime = new Date(newDate + 'T12:00:00').toISOString()
    newEndDateTime = new Date(newDate + 'T23:59:59').toISOString()
  }

  // Create pending move for confirmation
  pendingMove.value = {
    task: draggedTask.value,
    fromDate: draggedFromDate.value,
    toDate: newDate,
    newStartDateTime,
    newEndDateTime
  }

  draggedTask.value = null
  draggedFromDate.value = null
}

const confirmMove = async () => {
  if (!pendingMove.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/housekeeping-tasks/${pendingMove.value.task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDateTime: pendingMove.value.newStartDateTime,
        endDateTime: pendingMove.value.newEndDateTime,
        taskDate: pendingMove.value.toDate // Keep for compatibility
      })
    })

    if (response.ok) {
      pendingMove.value = null
      await fetchTasks()
    } else {
      const data = await response.json()
      error.value = data.error || 'Failed to move task'
      pendingMove.value = null
    }
  } catch (e) {
    error.value = 'Failed to move task'
    pendingMove.value = null
  } finally {
    loading.value = false
  }
}

const cancelMove = () => {
  pendingMove.value = null
}

// Header drag handlers
const handleHeaderMouseDown = (event: MouseEvent) => {
  isDraggingHeader.value = true
  dragStartX.value = event.clientX
  dragTranslateX.value = 0
  event.preventDefault()
}

const handleHeaderMouseMove = (event: MouseEvent) => {
  if (!isDraggingHeader.value) return

  // Calculate the translation distance (dragging follows mouse)
  const dragDistance = event.clientX - dragStartX.value
  dragTranslateX.value = dragDistance
}

const handleHeaderMouseUp = () => {
  if (!isDraggingHeader.value) return

  // Calculate how many days to offset based on drag distance
  // Positive dragTranslateX = dragged right = go backward in time
  // Negative dragTranslateX = dragged left = go forward in time
  const daysOffset = -Math.round(dragTranslateX.value / DATE_COLUMN_WIDTH)

  isDraggingHeader.value = false
  dragTranslateX.value = 0

  if (daysOffset !== 0) {
    // Mark that we just dropped to disable transition
    justDropped.value = true

    // Update date directly without slide animation
    const newDate = new Date(startDate.value)
    newDate.setDate(newDate.getDate() + daysOffset)
    startDate.value = newDate

    // Reset justDropped after a short delay
    setTimeout(() => {
      justDropped.value = false
    }, 50)
  }
}

// Wheel scroll handler
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  // Each scroll action moves exactly one day
  // Positive deltaY = scroll down = go forward in time (next day)
  // Negative deltaY = scroll up = go backward in time (previous day)
  const daysOffset = event.deltaY > 0 ? 1 : -1

  // Navigate instantly without animation for responsive wheel scrolling
  const newDate = new Date(startDate.value)
  newDate.setDate(newDate.getDate() + daysOffset)
  startDate.value = newDate
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchRooms(), fetchTasks()])
  loading.value = false

  // Wait for DOM to be fully rendered, then calculate initial days to show
  await nextTick()
  updateContainerWidth()

  // Update on window resize
  window.addEventListener('resize', updateContainerWidth)

  // Add global mouse event listeners for header dragging
  window.addEventListener('mousemove', handleHeaderMouseMove)
  window.addEventListener('mouseup', handleHeaderMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  window.removeEventListener('mousemove', handleHeaderMouseMove)
  window.removeEventListener('mouseup', handleHeaderMouseUp)
})
</script>

<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h1>
        <div class="view-selector" @click="toggleViewDropdown">
          <span
            class="codicon view-icon"
            :class="calendarViewType === 'tasklist' ? 'codicon-calendar' : 'codicon-tasklist'"
          ></span>
          <span class="view-title">{{ calendarViewType === 'tasklist' ? 'Housekeeping' : 'Reservations' }}</span>
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

    <div v-if="loading" class="loading">Loading calendar...</div>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!loading && filteredRooms.length > 0" class="calendar-container" @wheel="handleWheel">
      <div class="calendar-grid">
        <!-- Fixed room column -->
        <div class="room-column">
          <div class="room-header">
            <div class="room-header-text">{{ currentYear }}</div>
          </div>
          <div
            v-for="room in filteredRooms"
            :key="room.id"
            class="room-cell"
          >
            <div class="room-number">{{ room.roomNumber }}</div>
            <div class="room-type">{{ room.roomTypeName }}</div>
            <div v-if="room.floor" class="room-floor">Floor {{ room.floor }}</div>
          </div>
        </div>

        <!-- Scrolling date columns -->
        <Transition name="" mode="out-in">
          <div class="dates-section" :class="{ 'scrolling': isScrolling }" :key="startDate.toISOString()" :style="{ width: `${datesSectionWidth}px`, transform: datesSectionTransform }">
            <!-- Date headers -->
            <div class="dates-header" @mousedown="handleHeaderMouseDown">
              <div
                v-for="date in dates"
                :key="date.toISOString()"
                class="date-header"
                :class="{ 'is-today': isTodayInVisibleRange(date) }"
              >
                <div class="date-day">{{ getDayName(date) }}</div>
                <div class="date-number">{{ date.getDate() }}</div>
                <div class="date-month">{{ getMonthAbbr(date) }}</div>
              </div>
            </div>

            <!-- Date cells for each room -->
            <div
              v-for="room in filteredRooms"
              :key="room.id"
              class="dates-row"
            >
              <div
                v-for="date in dates"
                :key="`${room.id}-${date.toISOString()}`"
                class="date-cell"
                :class="{ 'is-today': isTodayInVisibleRange(date), 'drop-target': draggedTask !== null }"
                @dragover="handleDragOver"
                @drop="handleDrop($event, date)"
              >
            <!-- Regular tasks -->
            <div
              v-for="task in getTasksStartingOnDate(room.id, date)"
              :key="task.id"
              class="task-block"
              :class="[
                getStatusClass(task.status),
                { 'multi-day': isMultiDayTask(task) }
              ]"
              :style="getTaskStyle(task)"
              :title="`${task.assignedUserName} - ${task.taskType} - ${task.status}`"
              draggable="true"
              @dragstart="handleDragStart(task, date)"
            >
              <div class="task-content">
                <div class="task-header">
                  <span class="task-icon">{{ getTaskTypeIcon(task.taskType) }}</span>
                  <span class="task-staff">{{ task.assignedUserName }}</span>
                </div>
                <div class="task-type">{{ task.taskType }}</div>
                <div v-if="isMultiDayTask(task)" class="task-duration">
                  {{ getTaskDurationDisplay(task) }}
                </div>
              </div>
            </div>

            <!-- Pending moved task (preview in new location) -->
            <div
              v-if="pendingMove && pendingMove.toDate === formatDateISO(date) && pendingMove.task.roomId === room.id"
              class="task-block task-pending-move"
              :class="getStatusClass(pendingMove.task.status)"
              :title="`${pendingMove.task.assignedUserName} - ${pendingMove.task.taskType} - Pending move`"
            >
              <div class="task-content">
                <div class="task-header">
                  <span class="task-icon">{{ getTaskTypeIcon(pendingMove.task.taskType) }}</span>
                  <span class="task-staff">{{ pendingMove.task.assignedUserName }}</span>
                </div>
                <div class="task-type">{{ pendingMove.task.taskType }}</div>
              </div>
            </div>

            <!-- Confirmation buttons (in new location where task was dropped) -->
            <div
              v-if="pendingMove && pendingMove.toDate === formatDateISO(date) && pendingMove.task.roomId === room.id"
              class="confirm-move"
            >
              <button class="btn-confirm" @click="confirmMove" :disabled="loading">
                ✓ Confirm
              </button>
              <button class="btn-cancel" @click="cancelMove" :disabled="loading">
                ✕ Cancel
              </button>
            </div>

                <div v-if="getTasksStartingOnDate(room.id, date).length === 0 && (!pendingMove || pendingMove.fromDate !== formatDateISO(date) || pendingMove.task.roomId !== room.id)" class="empty-cell">
                  <!-- Empty cell -->
                </div>
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
  </div>
</template>

<style scoped>
.calendar-view {
  width: 100%;
  padding: 0.75rem;
}

.calendar-header {
  text-align: center;
  margin-bottom: 1rem;
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

.view-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.view-options select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
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
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow-x: visible;
  overflow-y: visible;
  margin-bottom: 2rem;
  max-width: 100%;
  position: relative;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  width: 100%;
  background: var(--color-background);
  overflow: visible;
}

.room-column {
  display: grid;
  grid-template-rows: auto;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
}

.room-header {
  width: 100px;
  padding: 0.4rem 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-heading);
  background: var(--color-background);
  border-bottom: 2px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 11;
  height: 4rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.room-header-text {
  margin: 0;
  padding: 0;
  line-height: 1.2;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  width: 100%;
  text-align: center;
}

.dates-section {
  display: grid;
  grid-template-rows: auto;
  overflow-x: visible;
  background: var(--color-background);
  will-change: transform;
  /* Grid skeleton pattern */
  background-image:
    /* Vertical lines every 100px */
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent 99px,
      var(--color-border) 99px,
      var(--color-border) 100px
    ),
    /* Horizontal line for header at 4rem */
    linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(4rem - 1px),
      var(--color-border) calc(4rem - 1px),
      var(--color-border) 4rem,
      transparent 4rem
    ),
    /* Horizontal lines for rows every 3rem starting after header */
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(3rem - 1px),
      var(--color-border) calc(3rem - 1px),
      var(--color-border) 3rem
    );
  background-position: 0 0, 0 0, 0 4rem;
  background-size: 100% 100%, 100% 100%, 100% 100%;
}

.dates-section.scrolling {
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.dates-header {
  display: flex;
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 10;
  cursor: grab;
  user-select: none;
}

.dates-header:active {
  cursor: grabbing;
}

.dates-row {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  height: 3rem;
  align-items: stretch;
  overflow: visible;
  position: relative;
}

.date-header {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  padding: 0.4rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
  font-size: 0.75rem;
  background: var(--color-background);
  height: 4rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.date-header.is-today {
  background: var(--color-primary-light);
  border-left: 2px solid var(--color-primary);
  border-right: 2px solid var(--color-primary);
}

.date-day {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.65rem;
  line-height: 1.2;
  margin: 0;
}

.date-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0;
}

.date-month {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.7;
  line-height: 1.2;
  margin: 0;
}

.room-cell {
  width: 100px;
  padding: 0.4rem 0.5rem;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  height: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: sticky;
  left: 0;
  z-index: 1;
  line-height: 1.2;
}

.room-number {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-heading);
}

.room-type {
  font-size: 0.7rem;
  color: var(--color-text);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-floor {
  display: none;
}

.date-cell {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  padding: 0.25rem;
  border-right: 1px solid var(--color-border);
  height: 3rem;
  overflow: visible;
  position: relative;
}

.date-cell.is-today {
  background: var(--color-primary-light);
  border-left: 2px solid var(--color-primary);
  border-right: 2px solid var(--color-primary);
  opacity: 0.3;
}

.date-cell.drop-target {
  background: var(--color-primary-light);
  opacity: 0.3;
  transition: background 0.2s;
}

.date-cell.drop-target:hover {
  background: var(--color-primary-light);
  opacity: 0.5;
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
}

.empty-cell {
  min-height: 2rem;
}

.confirm-move {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
}

.btn-confirm,
.btn-cancel {
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-confirm {
  background: var(--color-primary);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: scale(1.02);
}

.btn-cancel {
  background: var(--status-cancelled);
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--status-cancelled);
  opacity: 0.8;
  transform: scale(1.02);
}

.btn-confirm:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-block {
  padding: 0.3rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  cursor: move;
  transition: all 0.15s;
  border-left: 2px solid transparent;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.task-block:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 5;
  position: relative;
}

.task-block:active {
  cursor: grabbing;
  opacity: 0.7;
}

.task-pending-move {
  opacity: 0.6;
  border-style: dashed;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}

.task-block.multi-day {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  z-index: 10;
  min-height: 2.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: all;
}

.task-block.multi-day:hover {
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.task-duration {
  font-size: 0.6rem;
  opacity: 0.7;
  margin-top: 0.15rem;
  font-style: italic;
}

.task-pending {
  background: var(--status-pending-bg);
  border-left-color: var(--status-pending);
  color: var(--color-text);
}

.task-in-progress {
  background: var(--status-in-progress-bg);
  border-left-color: var(--status-in-progress);
  color: var(--status-in-progress);
}

.task-completed {
  background: var(--status-completed-bg);
  border-left-color: var(--status-completed);
  color: var(--status-completed);
}

.task-cancelled {
  background: var(--status-cancelled-bg);
  border-left-color: var(--status-cancelled);
  color: var(--status-cancelled);
  opacity: 0.7;
}

.task-content {
  width: 100%;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.15rem;
}

.task-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.task-staff {
  font-weight: 600;
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.task-type {
  font-size: 0.65rem;
  text-transform: capitalize;
  opacity: 0.85;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text);
  opacity: 0.7;
}

.calendar-legend {
  background: var(--color-background-soft);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.calendar-legend h3 {
  color: var(--color-heading);
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.legend-items {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.legend-items:last-child {
  margin-bottom: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text);
}

.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border-left: 2px solid;
  flex-shrink: 0;
}

.legend-box.task-pending {
  background: rgba(158, 158, 158, 0.2);
  border-left-color: #757575;
}

.legend-box.task-in-progress {
  background: rgba(33, 150, 243, 0.2);
  border-left-color: #2196f3;
}

.legend-box.task-completed {
  background: rgba(76, 175, 80, 0.2);
  border-left-color: #4caf50;
}

.legend-box.task-cancelled {
  background: rgba(244, 67, 54, 0.15);
  border-left-color: #f44336;
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

/* Dates section positioning */
.dates-section {
  position: relative;
}
</style>
