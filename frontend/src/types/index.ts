export interface HousekeepingTask {
  id: string
  roomId: string
  roomNumber?: string
  assignedUserId: string
  assignedUserName?: string
  taskDate: string
  startDateTime?: string
  endDateTime?: string
  duration?: number
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  startedAt?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface Room {
  id: string
  roomNumber: string
  roomTypeId: string
  roomTypeName?: string
  roomType?: { name: string }
  floor?: number
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface RoomType {
  id: string
  name: string
  description?: string
  baseRate: number
  maxOccupancy: number
  amenities?: string[]
  status: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface Staff {
  id: string
  firstName: string
  lastName: string
  role: string
  status: string
}

export interface User {
  id: string
  email: string
  userType: 'staff' | 'guest' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  staff?: {
    id: string
    firstName: string
    lastName: string
    role: string
    permissions: string[] | null
    status: string
  }
}
