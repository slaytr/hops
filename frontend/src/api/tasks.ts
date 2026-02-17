const API_URL = 'http://localhost:3000'

interface HousekeepingTask {
  id: string
  roomId: string
  taskDate: string
  duration: number
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

interface TasksResponse {
  tasks: HousekeepingTask[]
}

interface TaskResponse {
  task: HousekeepingTask
}

export async function fetchTasks(startDate: string, endDate: string): Promise<HousekeepingTask[]> {
  const response = await fetch(`${API_URL}/tasks?startDate=${startDate}&endDate=${endDate}`)
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  const data: TasksResponse = await response.json()
  return data.tasks
}

export async function createTask(taskData: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
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

  const data: TaskResponse = await response.json()
  return data.task
}

export async function updateTask(id: string, taskData: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update task')
  }

  const data: TaskResponse = await response.json()
  return data.task
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error('Failed to delete task')
  }
}
