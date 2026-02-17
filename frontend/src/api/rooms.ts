const API_URL = 'http://localhost:3000'

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

interface RoomsResponse {
  rooms: Room[]
}

export async function fetchRooms(): Promise<Room[]> {
  const response = await fetch(`${API_URL}/rooms`)
  if (!response.ok) {
    throw new Error('Failed to fetch rooms')
  }
  const data: RoomsResponse = await response.json()
  return data.rooms
}
