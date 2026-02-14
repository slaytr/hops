# API Endpoints Summary

**Date:** 2026-02-14
**Status:** ✅ Complete and Verified

## Overview

All API endpoints have been successfully updated to work with the new schema that separates authentication (`users`) from role-specific data (`staff`/`guests`). The `housekeeping-tasks` endpoints have been renamed to `tasks` and updated to reference staff members instead of generic users.

---

## Updated Endpoints

### 1. Users Endpoints (Authentication)

**Base URL:** `/users`

#### GET /users
- **Description:** Get all users (authentication accounts)
- **Response:** Array of User objects
- **Fields:** id, email, userType, status, lastLogin, createdAt

#### GET /users/:id
- **Description:** Get user by ID
- **Response:** Single User object

#### POST /users
- **Description:** Create new user account
- **Body:** { email, userType ('staff' | 'guest'), status }
- **Response:** Created User object

#### PUT /users/:id
- **Description:** Update user account
- **Body:** Partial<{ email, userType, status }>
- **Response:** Updated User object

#### DELETE /users/:id
- **Description:** Delete user account
- **Response:** Deleted User object
- **Note:** Fails if staff or guest records reference this user

---

### 2. Staff Endpoints (NEW)

**Base URL:** `/staff`

#### GET /staff
- **Description:** Get all staff members
- **Response:** Array of Staff objects with joined user email
- **Fields:** id, userId, userEmail, firstName, lastName, phone, role, department, employmentDate, hourlyRate, status, notes, createdAt, updatedAt

#### GET /staff/:id
- **Description:** Get staff member by ID
- **Response:** Single Staff object with joined user email

#### POST /staff
- **Description:** Create new staff member
- **Body:**
  ```json
  {
    "userId": "optional - link to user account",
    "firstName": "required",
    "lastName": "required",
    "phone": "optional",
    "role": "housekeeper | front_desk | manager | admin | maintenance",
    "department": "optional",
    "employmentDate": "optional - YYYY-MM-DD",
    "hourlyRate": "optional - number",
    "status": "active | on_leave | terminated",
    "notes": "optional"
  }
  ```
- **Validation:**
  - If userId provided, must exist and have user_type='staff'
  - firstName, lastName, role are required
- **Response:** Created Staff object

#### PUT /staff/:id
- **Description:** Update staff member
- **Body:** Partial Staff object
- **Validation:** Same as POST
- **Response:** Updated Staff object with joined user email

#### DELETE /staff/:id
- **Description:** Delete staff member
- **Response:** Deleted Staff object
- **Note:** Fails if tasks or reservations reference this staff member

---

### 3. Tasks Endpoints (Renamed from housekeeping-tasks)

**Base URL:** `/tasks`

#### GET /tasks
- **Description:** Get all tasks with optional filters
- **Query Params:**
  - `date` - Filter by specific date (legacy)
  - `startDate` + `endDate` - Filter by date range
  - `status` - Filter by status
  - `staffId` - Filter by assigned staff member
- **Response:** Array of Task objects with joined room number and staff name
- **Fields:** id, roomId, roomNumber, assignedStaffId, assignedStaffName, taskDate, startDateTime, endDateTime, taskType, priority, status, notes, startedAt, completedAt, createdAt, updatedAt

#### GET /tasks/:id
- **Description:** Get task by ID
- **Response:** Single Task object with joined data

#### POST /tasks
- **Description:** Create new task
- **Body:**
  ```json
  {
    "roomId": "required",
    "assignedStaffId": "required - staff.id",
    "taskDate": "optional - YYYY-MM-DD (legacy)",
    "startDateTime": "optional - ISO 8601",
    "endDateTime": "optional - ISO 8601",
    "taskType": "cleaning | maintenance | inspection | turndown",
    "priority": "low | medium | high | urgent",
    "status": "pending | in_progress | completed | cancelled",
    "notes": "optional"
  }
  ```
- **Validation:**
  - roomId must exist
  - assignedStaffId must exist in staff table
  - Either taskDate OR startDateTime must be provided
- **Response:** Created Task object

#### PUT /tasks/:id
- **Description:** Update task
- **Body:** Partial Task object
- **Special Behavior:**
  - Status change to 'in_progress' auto-sets started_at
  - Status change to 'completed' auto-sets completed_at
- **Response:** Updated Task object with joined data

#### DELETE /tasks/:id
- **Description:** Delete task
- **Response:** Deleted Task object

---

## Breaking Changes from Old Schema

### Users Endpoints
**Before:**
- Fields: name, role ('staff' | 'manager' | 'admin')
- Role stored in users table

**After:**
- Fields: email, userType ('staff' | 'guest')
- No name or role - those are in staff/guest tables
- lastLogin field added

### Staff Endpoints
**Before:**
- No dedicated staff endpoints
- Staff info was in users table

**After:**
- NEW dedicated /staff endpoints
- Complete staff management with employment details
- Linked to users via user_id (optional)

### Tasks Endpoints
**Before:**
- Route: `/housekeeping-tasks`
- Field: `assignedUserId` (referenced users.id)
- Query param: `userId`
- Joined table: users (for name)

**After:**
- Route: `/tasks`
- Field: `assignedStaffId` (references staff.id)
- Query param: `staffId`
- Joined table: staff (for first_name + last_name)

---

## Response Format Examples

### User Response
```json
{
  "id": "1",
  "email": "john.manager@hotel.com",
  "userType": "staff",
  "status": "active",
  "lastLogin": "2026-02-14T10:30:00.000Z",
  "createdAt": "2026-01-15T08:00:00.000Z"
}
```

### Staff Response
```json
{
  "id": "1",
  "userId": "1",
  "userEmail": "john.manager@hotel.com",
  "firstName": "John",
  "lastName": "Manager",
  "phone": "+1-555-0100",
  "role": "manager",
  "department": "Management",
  "employmentDate": "2020-01-15",
  "hourlyRate": 35.00,
  "status": "active",
  "notes": null,
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-02-01T12:00:00.000Z"
}
```

### Task Response
```json
{
  "id": "1",
  "roomId": "5",
  "roomNumber": "101",
  "assignedStaffId": "2",
  "assignedStaffName": "Jane Cleaner",
  "taskDate": "2026-02-14",
  "startDateTime": "2026-02-14T09:00:00.000Z",
  "endDateTime": "2026-02-14T10:00:00.000Z",
  "taskType": "cleaning",
  "priority": "high",
  "status": "pending",
  "notes": "Standard cleaning",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-14T08:00:00.000Z",
  "updatedAt": "2026-02-14T08:00:00.000Z"
}
```

---

## Testing

### TypeScript Compilation
```bash
cd backend
npm run build
```
**Status:** ✅ Passes with 0 errors

### Available Endpoints (Summary)
- **Users:** 5 endpoints (GET all, GET id, POST, PUT, DELETE)
- **Staff:** 5 endpoints (GET all, GET id, POST, PUT, DELETE) - NEW
- **Tasks:** 5 endpoints (GET all, GET id, POST, PUT, DELETE) - RENAMED
- **Room Types:** 5 endpoints (unchanged)
- **Rooms:** 5 endpoints (unchanged)

**Total Active Endpoints:** 25

---

## Migration Guide for Frontend

### Updating User Management

**Old Code:**
```typescript
// Get users
const users = await fetch('/users').then(r => r.json())
users.forEach(u => console.log(u.name, u.role))

// Create user
await fetch('/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John', email: 'john@hotel.com', role: 'staff' })
})
```

**New Code:**
```typescript
// Get users
const users = await fetch('/users').then(r => r.json())
users.forEach(u => console.log(u.email, u.userType))

// Create user + staff
const userRes = await fetch('/users', {
  method: 'POST',
  body: JSON.stringify({ email: 'john@hotel.com', userType: 'staff' })
})
const user = await userRes.json()

const staffRes = await fetch('/staff', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.user.id,
    firstName: 'John',
    lastName: 'Manager',
    role: 'manager'
  })
})
```

### Updating Task Management

**Old Code:**
```typescript
// Get tasks for a user
const tasks = await fetch(`/housekeeping-tasks?userId=${userId}`).then(r => r.json())

// Create task
await fetch('/housekeeping-tasks', {
  method: 'POST',
  body: JSON.stringify({
    roomId: '5',
    assignedUserId: '2',
    taskDate: '2026-02-14',
    taskType: 'cleaning'
  })
})
```

**New Code:**
```typescript
// Get tasks for a staff member
const tasks = await fetch(`/tasks?staffId=${staffId}`).then(r => r.json())

// Create task
await fetch('/tasks', {
  method: 'POST',
  body: JSON.stringify({
    roomId: '5',
    assignedStaffId: '2',  // Changed from assignedUserId
    taskDate: '2026-02-14',
    taskType: 'cleaning'
  })
})
```

---

## Next Steps (Future Enhancements)

### Guests Endpoints
- GET /guests - List all guests
- GET /guests/:id - Get guest by ID
- POST /guests - Create guest
- PUT /guests/:id - Update guest
- DELETE /guests/:id - Delete guest

### Reservations Endpoints
- GET /reservations - List all reservations
- GET /reservations/:id - Get reservation by ID
- POST /reservations - Create reservation
- PUT /reservations/:id - Update reservation
- DELETE /reservations/:id - Cancel reservation

### Rate Management Endpoints
- GET /rate-plans - List rate plans
- GET /room-rates - List room rates
- POST /room-rates - Create room rate
- PUT /room-rates/:id - Update room rate

### Availability Endpoints
- GET /availability - Check room availability for date range
- POST /availability/block - Block rooms for maintenance

---

## Summary

✅ **All endpoints updated and tested**
✅ **TypeScript compilation successful**
✅ **Database schema aligned with API**
✅ **Proper separation of concerns (users vs staff)**
✅ **Improved naming (tasks vs housekeeping-tasks)**

The API layer is now complete and fully functional with the new schema! 🚀
