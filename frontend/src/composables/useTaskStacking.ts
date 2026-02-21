import { computed, type Ref } from 'vue'
import type { HousekeepingTask } from '../types'

export function useTaskStacking(
  tasks: Ref<HousekeepingTask[]>,
  getTasksInCell: (roomId: string, date: Date) => HousekeepingTask[],
  getTaskDateRange: (task: HousekeepingTask) => Date[]
) {
  const TASK_HEIGHT = 30
  const TASK_SPACING = 2

  // Assign vertical tracks to tasks in a cell
  const calculateTaskTracks = (cellTasks: HousekeepingTask[], cellDate: Date): Map<string, number> => {
    const tracks = new Map<string, number>()
    const sortedTasks = [...cellTasks].sort((a, b) => {
      // Sort by duration (longer first), then by taskDate
      const aDuration = a.duration || 1
      const bDuration = b.duration || 1

      if (aDuration !== bDuration) {
        return bDuration - aDuration
      }

      return a.taskDate.localeCompare(b.taskDate)
    })

    sortedTasks.forEach((task, index) => {
      tracks.set(task.id, index)
    })

    return tracks
  }

  // Get vertical offset for a task based on its assigned track
  const getTaskVerticalOffset = (task: HousekeepingTask, roomId: string, date: Date): number => {
    const taskDates = getTaskDateRange(task)

    const overlappingTasks = new Set<string>()
    for (const taskDate of taskDates) {
      const cellTasks = getTasksInCell(roomId, taskDate)
      cellTasks.forEach(t => overlappingTasks.add(t.id))
    }

    const overlappingTaskObjects = tasks.value.filter(t => overlappingTasks.has(t.id))

    const tracks = calculateTaskTracks(overlappingTaskObjects, date)
    const track = tracks.get(task.id) || 0

    return track * (TASK_HEIGHT + TASK_SPACING) + 1
  }

  // Calculate row heights based on task stacking
  const calculateRowHeights = (
    filteredRooms: any[],
    dates: Date[]
  ): Map<string, number> => {
    const heights = new Map<string, number>()
    const BASE_ROW_HEIGHT = 67
    const TASKS_BEFORE_EXPAND = 2

    for (const room of filteredRooms) {
      let maxTracks = 0

      for (const date of dates) {
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
  }

  return {
    calculateTaskTracks,
    getTaskVerticalOffset,
    calculateRowHeights,
    TASK_HEIGHT,
    TASK_SPACING
  }
}
