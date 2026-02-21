export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const TASK_TYPE_ICONS: Record<string, string> = {
  cleaning: '🧹',
  maintenance: '🔧',
  inspection: '🔍',
  turndown: '🛏️'
}

export const TASK_STATUS_CLASSES: Record<string, string> = {
  pending: 'task-pending',
  in_progress: 'task-in-progress',
  completed: 'task-completed',
  cancelled: 'task-cancelled'
}
