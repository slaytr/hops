import { TASK_TYPE_ICONS, TASK_STATUS_CLASSES } from '../constants'

export function getTaskTypeIcon(type: string): string {
  return TASK_TYPE_ICONS[type] || '📋'
}

export function getTaskStatusClass(status: string): string {
  return TASK_STATUS_CLASSES[status] || ''
}
