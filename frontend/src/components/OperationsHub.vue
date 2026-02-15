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

// Date range controls
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const startDate = ref(yesterday)
const daysToShow = ref(7)
const containerWidth = ref(0)

// Fixed column widths (must match CSS)
const ROOM_COLUMN_WIDTH = 100
const DATE_COLUMN_WIDTH = 100

// Quadrant system constants
const QUADRANT_WIDTH = 25 // px
const QUADRANTS_PER_CELL = 4
const TASK_HEIGHT = 24 // px
const TASK_SPACING = 2 // px
const BASE_ROW_HEIGHT = 48 // px

// Drag and drop state
const draggedTask = ref<HousekeepingTask | null>(null)
const draggedFromDate = ref<string | null>(null)
const dragPreview = ref<{
  task: HousekeepingTask
  targetDate: Date
  targetQuadrant: number
  roomId: string
} | null>(null)
const pendingMove = ref<{
  task: HousekeepingTask
  fromDate: string
  toDate: string
  newStartDateTime: string
  newEndDateTime: string
} | null>(null)

// Resize state
const resizingTask = ref<HousekeepingTask | null>(null)
const resizeEdge = ref<'start' | 'end' | null>(null)
const resizePreview = ref<{
  task: HousekeepingTask
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

// Add task modal
const showAddTaskModal = ref(false)
const staff = ref<Staff[]>([])
const newTask = ref({
  taskType: 'cleaning' as 'cleaning' | 'maintenance' | 'inspection' | 'turndown',
  roomId: '',
  staffId: '',
  startDateTime: '',
  endDateTime: ''
})

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

// Calculate row height based on maximum task stacking
const rowHeights = computed(() => {
  const heights = new Map<string, number>()

  for (const room of filteredRooms.value) {
    let maxTracks = 0

    // Check all visible dates for this room
    for (const date of dates.value) {
      const cellTasks = getTasksInCell(room.id, date)
      if (cellTasks.length > 0) {
        const tracks = calculateTaskTracks(cellTasks, date)
        maxTracks = Math.max(maxTracks, tracks.size)
      }
    }

    // Calculate height: base + additional height for stacked tasks
    const height = maxTracks > 0
      ? BASE_ROW_HEIGHT + ((maxTracks - 1) * (TASK_HEIGHT + TASK_SPACING))
      : BASE_ROW_HEIGHT

    heights.set(room.id, height)
  }

  return heights
})

const getRowHeight = (roomId: string): string => {
  return `${rowHeights.value.get(roomId) || BASE_ROW_HEIGHT}px`
}

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
      `${API_URL}/tasks?startDate=${rangeStart}&endDate=${rangeEnd}`
    )
    const data = await response.json()
    tasks.value = data.tasks.map(migrateTaskToQuadrants)
  } catch (e) {
    error.value = 'Failed to fetch tasks'
  }
}

const fetchStaff = async () => {
  try {
    const response = await fetch(`${API_URL}/staff`)
    const data = await response.json()
    staff.value = data.staff
  } catch (e) {
    console.error('Failed to fetch staff:', e)
  }
}

const openAddTaskModal = () => {
  showAddTaskModal.value = true
  fetchStaff()
  // Reset form with defaults
  newTask.value = {
    taskType: 'cleaning',
    roomId: '',
    staffId: '',
    startDateTime: '',
    endDateTime: ''
  }
}

const closeAddTaskModal = () => {
  showAddTaskModal.value = false
}

const createTask = async () => {
  try {
    const taskData: any = {
      taskType: newTask.value.taskType,
      priority: 'medium',
      status: 'pending'
    }

    // Add room if selected
    if (newTask.value.roomId) {
      taskData.roomId = newTask.value.roomId
    }

    // Add staff if selected
    if (newTask.value.staffId) {
      taskData.staffId = newTask.value.staffId
    }

    // Add dates if provided
    if (newTask.value.startDateTime && newTask.value.endDateTime) {
      taskData.startDateTime = new Date(newTask.value.startDateTime).toISOString()
      taskData.endDateTime = new Date(newTask.value.endDateTime).toISOString()
      taskData.taskDate = taskData.startDateTime.split('T')[0]
    }
    // If no dates/room provided, task will be created without them and can be dragged onto calendar later

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create task')
    }

    await fetchTasks()
    closeAddTaskModal()
  } catch (e: any) {
    console.error('Failed to create task:', e)
    error.value = e.message || 'Failed to create task'
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

// Convert DateTime hour to quadrant number (1-4)
const getQuadrantFromDateTime = (dateTime: string): number => {
  const hour = new Date(dateTime).getUTCHours()
  if (hour < 9) return 1
  if (hour < 15) return 2
  if (hour < 20) return 3
  return 4
}

// Convert quadrant number to DateTime string
const quadrantToDateTime = (dateStr: string, quadrant: number): string => {
  const hours = [6, 12, 18, 21]
  return `${dateStr}T${hours[quadrant - 1].toString().padStart(2, '0')}:00:00Z`
}

// Calculate task width based on quadrant span
const getTaskQuadrantWidth = (task: HousekeepingTask): number => {
  if (!task.startDateTime || !task.endDateTime) {
    return DATE_COLUMN_WIDTH
  }

  const start = new Date(task.startDateTime)
  const end = new Date(task.endDateTime)

  const startDate = new Date(start.toISOString().split('T')[0])
  const endDate = new Date(end.toISOString().split('T')[0])

  const startQuadrant = getQuadrantFromDateTime(task.startDateTime)
  const endQuadrant = getQuadrantFromDateTime(task.endDateTime)

  const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysBetween === 0) {
    // Same day: width = (endQuadrant - startQuadrant + 1) × 25px
    return (endQuadrant - startQuadrant + 1) * QUADRANT_WIDTH
  }

  // Multi-day: calculate total quadrants across all days
  const startDayQuadrants = QUADRANTS_PER_CELL - startQuadrant + 1
  const endDayQuadrants = endQuadrant
  const middleDays = Math.max(0, daysBetween - 1)
  const totalQuadrants = startDayQuadrants + (middleDays * QUADRANTS_PER_CELL) + endDayQuadrants

  return totalQuadrants * QUADRANT_WIDTH
}

// Calculate left offset within cell based on start quadrant
const getTaskQuadrantOffset = (task: HousekeepingTask): number => {
  if (!task.startDateTime) return 0
  const startQuadrant = getQuadrantFromDateTime(task.startDateTime)
  return (startQuadrant - 1) * QUADRANT_WIDTH
}

// Migrate legacy tasks to quadrant format
const migrateTaskToQuadrants = (task: HousekeepingTask): HousekeepingTask => {
  if (!task.startDateTime || !task.endDateTime) {
    // Legacy task with only taskDate
    return {
      ...task,
      startDateTime: `${task.taskDate}T06:00:00Z`,
      endDateTime: `${task.taskDate}T21:00:00Z`
    }
  }

  // Check if already quadrant-aligned
  const startHour = new Date(task.startDateTime).getUTCHours()
  const isQuadrantAligned = [6, 12, 18, 21].includes(startHour)

  if (!isQuadrantAligned) {
    // Round to nearest quadrant
    const quadrant = getQuadrantFromDateTime(task.startDateTime)
    const endQuadrant = getQuadrantFromDateTime(task.endDateTime)
    const startDate = task.startDateTime.split('T')[0]
    const endDate = task.endDateTime.split('T')[0]

    return {
      ...task,
      startDateTime: quadrantToDateTime(startDate, quadrant),
      endDateTime: quadrantToDateTime(endDate, endQuadrant)
    }
  }

  return task
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

const getTaskStyle = (task: HousekeepingTask, roomId: string, startDate: Date) => {
  const width = getTaskQuadrantWidth(task)
  const left = getTaskQuadrantOffset(task)
  const verticalOffset = getTaskVerticalOffset(task, roomId, startDate)

  // All tasks use absolute positioning to overlay the quadrant zones
  const baseTop = 0.25 * 16 // 0.25rem padding

  return {
    position: 'absolute',
    width: `${width}px`,
    left: `${0.25 * 16 + left}px`, // Add cell padding to left offset
    top: `${baseTop + verticalOffset}px`,
    zIndex: isMultiDayTask(task) ? 10 : 5,
    minHeight: `${TASK_HEIGHT}px`
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

// Get all tasks present in a specific cell (overlapping with that date)
const getTasksInCell = (roomId: string, date: Date): HousekeepingTask[] => {
  const dateStr = formatDateISO(date)
  const cellStart = new Date(dateStr + 'T00:00:00')
  const cellEnd = new Date(dateStr + 'T23:59:59')

  return tasks.value.filter(t => {
    if (t.roomId !== roomId) return false

    const taskStart = t.startDateTime ? new Date(t.startDateTime) : new Date(t.taskDate)
    const taskEnd = t.endDateTime ? new Date(t.endDateTime) : new Date(t.taskDate)

    return taskStart <= cellEnd && taskEnd >= cellStart
  })
}

// Assign vertical tracks to stacked tasks
const calculateTaskTracks = (tasks: HousekeepingTask[], cellDate: Date): Map<string, number> => {
  const tracks = new Map<string, number>()
  const sortedTasks = [...tasks].sort((a, b) => {
    const aStart = new Date(a.startDateTime || a.taskDate)
    const bStart = new Date(b.startDateTime || b.taskDate)
    return aStart.getTime() - bStart.getTime()
  })

  for (const task of sortedTasks) {
    let track = 0
    const occupiedTracks = new Set<number>()

    // Find which tracks are occupied by overlapping tasks
    for (const [otherId, otherTrack] of tracks.entries()) {
      const otherTask = tasks.find(t => t.id === otherId)
      if (otherTask && tasksOverlap(task, otherTask)) {
        occupiedTracks.add(otherTrack)
      }
    }

    // Assign first available track
    while (occupiedTracks.has(track)) {
      track++
    }

    tracks.set(task.id, track)
  }

  return tracks
}

// Check if two tasks overlap in time
const tasksOverlap = (task1: HousekeepingTask, task2: HousekeepingTask): boolean => {
  const start1 = new Date(task1.startDateTime || task1.taskDate)
  const end1 = new Date(task1.endDateTime || task1.taskDate)
  const start2 = new Date(task2.startDateTime || task2.taskDate)
  const end2 = new Date(task2.endDateTime || task2.taskDate)

  return start1 <= end2 && end1 >= start2
}

// Get vertical offset for a task based on its assigned track
const getTaskVerticalOffset = (task: HousekeepingTask, roomId: string, date: Date): number => {
  const cellTasks = getTasksInCell(roomId, date)
  const tracks = calculateTaskTracks(cellTasks, date)
  const track = tracks.get(task.id) || 0

  return track * (TASK_HEIGHT + TASK_SPACING)
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
  // Don't allow dragging while confirming a move
  if (pendingMove.value) return

  draggedTask.value = task
  draggedFromDate.value = formatDateISO(date)
  dragPreview.value = null
}

const handleDragEnterQuadrant = (date: Date, quadrant: number, roomId: string) => {
  if (!draggedTask.value || !draggedFromDate.value) return

  dragPreview.value = {
    task: draggedTask.value,
    targetDate: date,
    targetQuadrant: quadrant,
    roomId
  }
}

const getDragPreviewStyle = () => {
  if (!dragPreview.value || !draggedTask.value) return {}

  const task = draggedTask.value
  const targetQuadrant = dragPreview.value.targetQuadrant

  // Calculate what the new position would be
  const oldQuadrant = task.startDateTime
    ? getQuadrantFromDateTime(task.startDateTime)
    : 1
  const quadrantDiff = targetQuadrant - oldQuadrant

  // Calculate task width and position at target
  let previewWidth = getTaskQuadrantWidth(task)
  let previewLeft = (targetQuadrant - 1) * QUADRANT_WIDTH

  return {
    position: 'absolute',
    width: `${previewWidth}px`,
    left: `${0.25 * 16 + previewLeft}px`,
    top: '0.25rem',
    zIndex: 15,
    opacity: 0.5,
    border: '2px dashed var(--color-primary)',
    pointerEvents: 'none',
    minHeight: `${TASK_HEIGHT}px`
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent, date: Date, targetQuadrant: number) => {
  event.preventDefault()

  if (!draggedTask.value || !draggedFromDate.value) return

  const newDate = formatDateISO(date)

  // Calculate offsets
  const oldDate = new Date(draggedFromDate.value)
  const newStartDate = new Date(newDate)
  const daysDiff = Math.floor((newStartDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24))

  const oldQuadrant = draggedTask.value.startDateTime
    ? getQuadrantFromDateTime(draggedTask.value.startDateTime)
    : 1
  const quadrantDiff = targetQuadrant - oldQuadrant

  // Calculate new start and end DateTimes
  let newStartDateTime: string
  let newEndDateTime: string

  if (draggedTask.value.startDateTime && draggedTask.value.endDateTime) {
    const oldStart = new Date(draggedTask.value.startDateTime)
    const oldEnd = new Date(draggedTask.value.endDateTime)

    const oldStartQuadrant = getQuadrantFromDateTime(draggedTask.value.startDateTime)
    const oldEndQuadrant = getQuadrantFromDateTime(draggedTask.value.endDateTime)

    const newStartQuadrant = Math.max(1, Math.min(4, oldStartQuadrant + quadrantDiff))
    const newEndQuadrant = Math.max(1, Math.min(4, oldEndQuadrant + quadrantDiff))

    // Shift dates
    oldStart.setDate(oldStart.getDate() + daysDiff)
    oldEnd.setDate(oldEnd.getDate() + daysDiff)

    const startDateStr = oldStart.toISOString().split('T')[0]
    const endDateStr = oldEnd.toISOString().split('T')[0]

    newStartDateTime = quadrantToDateTime(startDateStr, newStartQuadrant)
    newEndDateTime = quadrantToDateTime(endDateStr, newEndQuadrant)
  } else {
    // Single-day task: convert to quadrant-based format
    newStartDateTime = quadrantToDateTime(newDate, targetQuadrant)
    newEndDateTime = quadrantToDateTime(newDate, targetQuadrant)
  }

  // Create pending move for user confirmation
  pendingMove.value = {
    task: draggedTask.value,
    fromDate: draggedFromDate.value,
    toDate: newDate,
    newStartDateTime,
    newEndDateTime
  }

  draggedTask.value = null
  draggedFromDate.value = null
  dragPreview.value = null
}

const confirmMove = async () => {
  if (!pendingMove.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/tasks/${pendingMove.value.task.id}`, {
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

const handleDragEnd = () => {
  if (!pendingMove.value) {
    // Drag was cancelled without a drop
    draggedTask.value = null
    draggedFromDate.value = null
    dragPreview.value = null
  }
}

// Resize handlers
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

const handleResizeMove = (event: MouseEvent, date: Date, targetQuadrant: number) => {
  if (!resizingTask.value || !resizeEdge.value) return

  const newDateStr = formatDateISO(date)
  const task = resizingTask.value

  const currentStart = task.startDateTime || `${task.taskDate}T06:00:00`
  const currentEnd = task.endDateTime || `${task.taskDate}T21:00:00`

  let newStart = currentStart
  let newEnd = currentEnd

  if (resizeEdge.value === 'start') {
    newStart = quadrantToDateTime(newDateStr, targetQuadrant)
    if (new Date(newStart) >= new Date(currentEnd)) return
  } else {
    newEnd = quadrantToDateTime(newDateStr, targetQuadrant)
    if (new Date(newEnd) <= new Date(currentStart)) return
  }

  resizePreview.value = {
    task,
    newStartDateTime: newStart,
    newEndDateTime: newEnd
  }
}

const handleResizeEnd = async () => {
  if (!resizingTask.value || !resizePreview.value) {
    resizingTask.value = null
    resizeEdge.value = null
    resizePreview.value = null
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/tasks/${resizingTask.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDateTime: resizePreview.value.newStartDateTime,
        endDateTime: resizePreview.value.newEndDateTime,
        taskDate: new Date(resizePreview.value.newStartDateTime).toISOString().split('T')[0]
      })
    })

    if (response.ok) {
      await fetchTasks()
    } else {
      const data = await response.json()
      error.value = data.error || 'Failed to resize task'
    }
  } catch (e) {
    error.value = 'Failed to resize task'
  } finally {
    loading.value = false
    resizingTask.value = null
    resizeEdge.value = null
    resizePreview.value = null
  }
}

const cancelResize = () => {
  resizingTask.value = null
  resizeEdge.value = null
  resizePreview.value = null
}

const getResizePreviewWidth = (preview: typeof resizePreview.value) => {
  if (!preview) return DATE_COLUMN_WIDTH

  return getTaskQuadrantWidth({
    ...preview.task,
    startDateTime: preview.newStartDateTime,
    endDateTime: preview.newEndDateTime
  })
}

const getConfirmButtonsPosition = () => {
  if (!pendingMove.value) return {}

  // Find the cell where the task was dropped
  const toDateStr = formatDateISO(new Date(pendingMove.value.toDate))
  const roomId = pendingMove.value.task.roomId

  // Calculate position based on room index and date index
  const roomIndex = filteredRooms.value.findIndex(r => r.id === roomId)
  const dateIndex = dates.value.findIndex(d => formatDateISO(d) === toDateStr)

  if (roomIndex === -1 || dateIndex === -1) return {}

  // Calculate position more accurately
  // Header height is 4rem = 64px, row height is 3rem = 48px
  const headerHeight = 64 // 4rem
  const rowHeight = 48 // 3rem
  const top = headerHeight + (roomIndex * rowHeight) + rowHeight + 5 // header + rows before + current row + small padding

  // Account for buffer offset if dragging
  const bufferOffset = isDraggingHeader.value || isScrolling.value ? -(BUFFER_DAYS * DATE_COLUMN_WIDTH) : 0
  const left = ROOM_COLUMN_WIDTH + (dateIndex * DATE_COLUMN_WIDTH) + bufferOffset + 5

  return {
    top: `${top}px`,
    left: `${left}px`
  }
}

// Header drag handlers
const handleHeaderMouseDown = (event: MouseEvent) => {
  // Don't allow dragging while confirming a move
  if (pendingMove.value) return

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

  // Don't allow scrolling while confirming a move
  if (pendingMove.value) return

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

  // Add global mouse event listeners for header dragging and resizing
  window.addEventListener('mousemove', handleHeaderMouseMove)
  window.addEventListener('mouseup', handleHeaderMouseUp)
  window.addEventListener('mouseup', handleResizeEnd)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  window.removeEventListener('mousemove', handleHeaderMouseMove)
  window.removeEventListener('mouseup', handleHeaderMouseUp)
  window.removeEventListener('mouseup', handleResizeEnd)
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

    <!-- Task Management Actions -->
    <div class="task-actions">
      <button class="action-btn primary" @click="openAddTaskModal">
        <span class="codicon codicon-add"></span>
        Task
      </button>
      <button class="action-btn">
        <span class="codicon codicon-person"></span>
        Bulk Assign
      </button>
      <button class="action-btn">
        <span class="codicon codicon-copy"></span>
        Duplicate Tasks
      </button>
      <button class="action-btn">
        <span class="codicon codicon-file-code"></span>
        Task Templates
      </button>
      <button class="action-btn">
        <span class="codicon codicon-export"></span>
        Export
      </button>
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
            <div class="room-type">{{ room.roomType?.name }}</div>
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
              :style="{ height: getRowHeight(room.id), minHeight: getRowHeight(room.id) }"
            >
              <div
                v-for="date in dates"
                :key="`${room.id}-${date.toISOString()}`"
                class="date-cell"
                :class="{ 'is-today': isTodayInVisibleRange(date) }"
              >
                <!-- Quadrant drop zones -->
                <div
                  v-for="quadrant in [1, 2, 3, 4]"
                  :key="`${room.id}-${date.toISOString()}-q${quadrant}`"
                  class="quadrant-zone"
                  :class="{ 'drop-target': draggedTask !== null }"
                  @dragover="handleDragOver"
                  @dragenter="() => handleDragEnterQuadrant(date, quadrant, room.id)"
                  @drop="handleDrop($event, date, quadrant)"
                  @mouseenter="(e) => { if (resizingTask) handleResizeMove(e as MouseEvent, date, quadrant) }"
                ></div>

                <!-- Drag preview -->
                <div
                  v-if="dragPreview && dragPreview.roomId === room.id && formatDateISO(dragPreview.targetDate) === formatDateISO(date)"
                  class="task-block task-drag-preview"
                  :class="getStatusClass(dragPreview.task.status)"
                  :style="getDragPreviewStyle()"
                >
                  <div class="task-content">
                    <div class="task-header">
                      <span class="task-icon">{{ getTaskTypeIcon(dragPreview.task.taskType) }}</span>
                      <span class="task-staff">{{ dragPreview.task.assignedUserName }}</span>
                    </div>
                    <div class="task-type">{{ dragPreview.task.taskType }}</div>
                  </div>
                </div>
            <!-- Regular tasks -->
            <div
              v-for="task in getTasksStartingOnDate(room.id, date)"
              :key="task.id"
              class="task-block"
              :class="[
                getStatusClass(task.status),
                {
                  'multi-day': isMultiDayTask(task),
                  'resizing': resizingTask?.id === task.id,
                  'dragging': draggedTask?.id === task.id
                }
              ]"
              :style="getTaskStyle(task, room.id, date)"
              :title="`${task.assignedUserName} - ${task.taskType} - ${task.status}`"
              draggable="true"
              @dragstart="handleDragStart(task, date)"
              @dragend="handleDragEnd"
              @mouseenter="(e) => {
                const target = e.currentTarget as HTMLElement
                target.querySelectorAll('.resize-handle').forEach(h => (h as HTMLElement).style.opacity = '1')
              }"
              @mouseleave="(e) => {
                const target = e.currentTarget as HTMLElement
                target.querySelectorAll('.resize-handle').forEach(h => (h as HTMLElement).style.opacity = '0')
              }"
            >
              <!-- Left resize handle -->
              <div
                class="resize-handle resize-handle-left"
                @mousedown.stop="(e) => handleResizeStart(e, task, 'start')"
                @mouseenter="(e) => e.stopPropagation()"
              ></div>

              <div class="task-content">
                <span class="task-icon">{{ getTaskTypeIcon(task.taskType) }}</span>
                <span class="task-staff">{{ task.assignedUserName || 'Unassigned' }}</span>
              </div>

              <!-- Right resize handle -->
              <div
                class="resize-handle resize-handle-right"
                @mousedown.stop="(e) => handleResizeStart(e, task, 'end')"
                @mouseenter="(e) => e.stopPropagation()"
              ></div>
            </div>

            <!-- Pending moved task (preview in new location) -->
            <div
              v-if="pendingMove && pendingMove.toDate === formatDateISO(date) && pendingMove.task.roomId === room.id"
              class="task-block task-pending-move"
              :class="getStatusClass(pendingMove.task.status)"
              :title="`${pendingMove.task.assignedUserName} - ${pendingMove.task.taskType} - Pending move`"
            >
              <div class="task-content">
                <span class="task-icon">{{ getTaskTypeIcon(pendingMove.task.taskType) }}</span>
                <span class="task-staff">{{ pendingMove.task.assignedUserName || 'Unassigned' }}</span>
              </div>
            </div>

            <!-- Resize preview overlay -->
            <div
              v-if="resizePreview && resizePreview.task.roomId === room.id && formatDateISO(date) === resizePreview.newStartDateTime.split('T')[0]"
              class="task-block task-resize-preview"
              :class="getStatusClass(resizePreview.task.status)"
              :style="{
                position: 'absolute',
                width: `${getResizePreviewWidth(resizePreview)}px`,
                zIndex: 15,
                minHeight: '2.5rem',
                pointerEvents: 'none'
              }"
            >
              <div class="task-content">
                <span class="task-icon">{{ getTaskTypeIcon(resizePreview.task.taskType) }}</span>
                <span class="task-staff">{{ resizePreview.task.assignedUserName || 'Unassigned' }}</span>
              </div>
            </div>

              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Lock overlay when confirming move -->
      <div v-if="pendingMove" class="calendar-lock-overlay" @click="cancelMove"></div>

      <!-- Floating confirmation buttons -->
      <div v-if="pendingMove" class="confirm-buttons-container" :style="getConfirmButtonsPosition()" @click.stop>
        <button class="btn-confirm" @click="confirmMove" :disabled="loading">
          ✓ Confirm
        </button>
        <button class="btn-cancel" @click="cancelMove" :disabled="loading">
          ✕ Cancel
        </button>
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

    <!-- Add Task Modal -->
    <div v-if="showAddTaskModal" class="modal-overlay" @click.self="closeAddTaskModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><span class="codicon codicon-add"></span> Add New Task</h3>
          <button @click="closeAddTaskModal" class="modal-close">
            <span class="codicon codicon-close"></span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="task-type">Task Type <span class="required">*</span></label>
            <select id="task-type" v-model="newTask.taskType" class="form-control">
              <option value="cleaning">🧹 Cleaning</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="inspection">🔍 Inspection</option>
              <option value="turndown">🛏️ Turndown</option>
            </select>
          </div>

          <div class="form-divider">
            <span>All fields below are optional</span>
          </div>

          <div class="form-group">
            <label for="room">Room</label>
            <select id="room" v-model="newTask.roomId" class="form-control">
              <option value="">Unassigned</option>
              <option v-for="room in filteredRooms" :key="room.id" :value="room.id">
                {{ room.roomNumber }} - {{ room.roomType?.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="staff">Staff</label>
            <select id="staff" v-model="newTask.staffId" class="form-control">
              <option value="">Unassigned</option>
              <option v-for="member in staff" :key="member.id" :value="member.id">
                {{ member.firstName }} {{ member.lastName }} - {{ member.role }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="start-datetime">Start Date & Time</label>
            <input
              id="start-datetime"
              type="datetime-local"
              v-model="newTask.startDateTime"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="end-datetime">End Date & Time</label>
            <input
              id="end-datetime"
              type="datetime-local"
              v-model="newTask.endDateTime"
              class="form-control"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddTaskModal" class="btn-secondary">Cancel</button>
          <button @click="createTask" class="btn-primary">Create Task</button>
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

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.primary {
  background: var(--vt-c-green-soft);
  border-color: var(--vt-c-green-dark);
  color: var(--vt-c-green-darker);
  font-weight: 600;
}

.action-btn.primary:hover {
  background: var(--vt-c-green);
  border-color: var(--vt-c-green-darker);
}

.action-btn .codicon {
  font-size: 1rem;
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
  left: 0;
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
  min-height: 3rem;
  align-items: flex-start;
  overflow: visible;
  position: relative;
  transition: height 0.2s ease;
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
  min-height: 3rem;
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
  min-height: 3rem;
  overflow: visible;
  position: relative;
}

/* Quadrant drop zones */
.quadrant-zone {
  width: 25px;
  min-width: 25px;
  height: 100%;
  position: absolute;
  flex-shrink: 0;
  z-index: 1;
  pointer-events: all;
}

.quadrant-zone:nth-child(1) { left: 0; }
.quadrant-zone:nth-child(2) { left: 25px; }
.quadrant-zone:nth-child(3) { left: 50px; }
.quadrant-zone:nth-child(4) { left: 75px; }

.quadrant-zone.drop-target {
  transition: background 0.05s;
}

.quadrant-zone.drop-target:hover {
  background: var(--color-primary-light);
  opacity: 0.25;
}

.date-cell.is-today {
  position: relative;
  border-left: 2px solid var(--color-primary);
  border-right: 2px solid var(--color-primary);
}

.date-cell.is-today::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-primary-light);
  opacity: 0.3;
  pointer-events: none;
  z-index: -1;
}


/* Calendar lock overlay */
.calendar-lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 50;
  cursor: pointer;
  backdrop-filter: blur(1px);
}

/* Floating confirmation buttons */
.confirm-buttons-container {
  position: absolute;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: var(--color-background);
  padding: 0.5rem;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  animation: fadeIn 0.15s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-confirm,
.btn-cancel {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
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
  opacity: 0.85;
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
  pointer-events: all;
  z-index: 10;
  position: relative;
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

.task-block.dragging {
  opacity: 0.25;
  cursor: grabbing;
  transition: opacity 0.05s;
}

.task-pending-move {
  opacity: 0.6;
  border-style: dashed;
  animation: pulse 1s ease-in-out infinite;
}

.task-drag-preview {
  opacity: 0.7;
  border: 2px dashed var(--color-primary) !important;
  background: var(--color-primary-light) !important;
  transition: all 0.05s ease-out;
}

.task-resize-preview {
  opacity: 0.7;
  border: 2px dashed var(--color-primary);
  animation: pulse-resize 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes pulse-resize {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.01);
  }
}


.task-block.multi-day {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-block.multi-day:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  overflow: hidden;
}

.task-icon {
  font-size: 0.75rem;
  flex-shrink: 0;
  line-height: 1;
}

.task-staff {
  font-weight: 500;
  font-size: 0.7rem;
  white-space: nowrap;
  flex: 1;
  line-height: 1;
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

  .task-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1 1 auto;
    min-width: fit-content;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s;
}

.modal-close:hover {
  background: var(--color-background-soft);
}

.modal-close .codicon {
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-heading);
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: border-color 0.15s;
}

.form-control:focus {
  outline: none;
  border-color: var(--vt-c-green);
}

.form-control:hover {
  border-color: var(--color-border-hover);
}

.form-divider {
  margin: 1.5rem 0;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.form-divider span {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;
  font-style: italic;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid;
}

.btn-primary {
  background: var(--vt-c-green-soft);
  border-color: var(--vt-c-green-dark);
  color: var(--vt-c-green-darker);
}

.btn-primary:hover {
  background: var(--vt-c-green);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.required {
  color: #f44336;
  margin-left: 0.25rem;
}
</style>
