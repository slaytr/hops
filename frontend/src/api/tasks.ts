import type { HousekeepingTask } from '../types'
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export async function fetchTasks(startDate: string, endDate: string): Promise<HousekeepingTask[]> {
  const data = await apiGet<{ tasks: HousekeepingTask[] }>(`/tasks?startDate=${startDate}&endDate=${endDate}`)
  return data.tasks
}

export async function createTask(taskData: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
  const data = await apiPost<{ task: HousekeepingTask }>('/tasks', taskData)
  return data.task
}

export async function updateTask(id: string, taskData: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
  const data = await apiPut<{ task: HousekeepingTask }>(`/tasks/${id}`, taskData)
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete(`/tasks/${id}`)
}
