import type { Staff } from '../types'
import { apiGet } from './client'

export async function fetchStaff(): Promise<Staff[]> {
  const data = await apiGet<{ staff: Staff[] }>('/staff')
  return data.staff
}
