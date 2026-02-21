import type { Room } from '../types'
import { apiGet } from './client'

export async function fetchRooms(): Promise<Room[]> {
  const data = await apiGet<{ rooms: Room[] }>('/rooms')
  return data.rooms
}
