const API_URL = 'http://localhost:3000'

interface Staff {
  id: string
  firstName: string
  lastName: string
  role: string
  status: string
}

interface StaffResponse {
  staff: Staff[]
}

export async function fetchStaff(): Promise<Staff[]> {
  const response = await fetch(`${API_URL}/staff`)
  if (!response.ok) {
    throw new Error('Failed to fetch staff')
  }
  const data: StaffResponse = await response.json()
  return data.staff
}
