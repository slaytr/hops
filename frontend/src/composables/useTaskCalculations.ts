import { computed, type Ref } from 'vue'
import type { HousekeepingTask } from '../types'

export function useTaskCalculations(tasks: Ref<HousekeepingTask[]>) {
  const DATE_COLUMN_WIDTH = 100

  // Get task date range as array of dates
  const getTaskDateRange = (task: HousekeepingTask): Date[] => {
    const dates: Date[] = []
    const duration = task.duration || 1
    const start = new Date(task.taskDate + 'T00:00:00')

    for (let i = 0; i < duration; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }

    return dates
  }

  // Calculate task width: full cell width per day of duration
  const getTaskWidth = (task: HousekeepingTask): number => {
    const duration = task.duration || 1
    return DATE_COLUMN_WIDTH * duration
  }

  // Check if task is multi-day
  const isMultiDayTask = (task: HousekeepingTask): boolean => {
    return (task.duration || 1) > 1
  }

  // Format date to ISO string (YYYY-MM-DD)
  const formatDateISO = (date: Date): string => {
    return date.toISOString().split('T')[0] as string
  }

  // Get all tasks in a specific cell (room + date)
  const getTasksInCell = (roomId: string, date: Date): HousekeepingTask[] => {
    const dateStr = formatDateISO(date)

    return tasks.value.filter(t => {
      if (t.roomId !== roomId) return false

      const taskStart = t.taskDate
      const duration = t.duration || 1

      // Calculate task end date
      const startDate = new Date(taskStart + 'T00:00:00')
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + duration - 1)
      const taskEnd = formatDateISO(endDate)

      return taskStart <= dateStr && taskEnd >= dateStr
    })
  }

  // Check if task starts on specific date
  const taskStartsOnDate = (task: HousekeepingTask, date: Date): boolean => {
    const dateStr = formatDateISO(date)
    return dateStr === task.taskDate
  }

  return {
    getTaskDateRange,
    getTaskWidth,
    isMultiDayTask,
    formatDateISO,
    getTasksInCell,
    taskStartsOnDate,
    DATE_COLUMN_WIDTH
  }
}
