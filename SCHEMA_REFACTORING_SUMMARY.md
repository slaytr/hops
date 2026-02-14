# Schema Refactoring Summary

**Date:** 2026-02-14
**Status:** ✅ Database Schema Complete | ⚠️ API Endpoints Need Updates

## Overview

Successfully restructured the user management system to separate authentication from roles, and renamed `housekeeping_tasks` to `tasks`. The new structure provides better separation of concerns with `users` handling authentication while `staff` and `guests` tables contain role-specific details.

---

## What Was Changed

### 1. Renamed Table
- **housekeeping_tasks** → **tasks**
  - Renamed `assigned_user_id` → `assigned_staff_id`
  - Now references `staff.id` instead of `users.id`

### 2. New User Management Structure

#### **users** (Authentication)
- Simplified to handle authentication only
- Fields: id, email, password_hash, user_type (staff/guest), status, last_login
- No longer stores names or role details

#### **staff** (Staff Details)
- New table for staff member information
- Fields: id, user_id (FK to users), first_name, last_name, phone, role, department, employment_date, hourly_rate, status, notes
- Roles: housekeeper, front_desk, manager, admin, maintenance
- Status: active, on_leave, terminated

#### **guests** (Guest Details - Enhanced)
- Added `user_id` (FK to users, nullable)
- Supports both registered guests (with user account) and walk-ins (no user account)
- Existing fields preserved: contact info, preferences, VIP status, etc.

### 3. Updated Foreign Keys

**reservations:**
- `booked_by` → `booked_by_staff_id` (references staff.id)
- `cancelled_by` → `cancelled_by_staff_id` (references staff.id)

**tasks:**
- `assigned_user_id` → `assigned_staff_id` (references staff.id)

---

## File Structure Changes

### SQL Schema Files (Renumbered)
1. **01-users.sql** - Authentication table (modified)
2. **02-staff.sql** - Staff details (NEW)
3. **03-room_types.sql** - Room types (renumbered from 02)
4. **04-rooms.sql** - Rooms (renumbered from 03)
5. **05-tasks.sql** - Tasks (renamed from 04-housekeeping_tasks.sql)
6. **06-guests.sql** - Guests with user_id (modified, renumbered from 05)
7. **07-rate_plans.sql** - Rate plans (renumbered from 06)
8. **08-room_rates.sql** - Room rates (renumbered from 07)
9. **09-reservations.sql** - Reservations with staff FKs (modified, renumbered from 08)
10. **10-room_occupancy.sql** - Occupancy (renumbered from 09)

### TypeScript Interfaces Updated

**backend/src/db/index.ts:**
- Updated `DbUser` - removed name/role, added user_type, password_hash, last_login
- Added `DbStaff` - NEW interface for staff table
- Updated `DbGuest` - added user_id field
- Renamed `DbHousekeepingTask` → `DbTask` - updated assigned_staff_id
- Updated `DbReservation` - changed booked_by/cancelled_by to booked_by_staff_id/cancelled_by_staff_id

**backend/src/server.ts:**
- Updated `User` interface - removed name/role, added userType
- Added `Staff` interface - NEW for staff endpoints
- Updated `Guest` interface - added userId field
- Renamed `HousekeepingTask` → `Task` - updated assignedStaffId
- Updated `Reservation` interface - changed staff ID fields

### Scripts Updated
- **initSchema.ts** - Updated to reference all 10 new SQL files
- **seed.ts** - Completely rewritten for new structure (users→staff, tasks with staff_id)
- **verifySchema.ts** - Updated queries to test users/staff relationships
- **dropTables.ts** - NEW script to clean database before reinitializing

---

## Database Relationships

```
users (authentication)
├── staff.user_id → users.id (staff details)
└── guests.user_id → users.id (registered guest accounts)

staff
├── tasks.assigned_staff_id → staff.id
└── reservations.booked_by_staff_id → staff.id
└── reservations.cancelled_by_staff_id → staff.id
```

---

## Verification Results

### Tables Created
✅ All 10 tables exist with correct schema

### Foreign Keys
✅ 15 foreign key constraints verified:
- guests.user_id → users.id
- staff.user_id → users.id
- tasks.assigned_staff_id → staff.id
- reservations.booked_by_staff_id → staff.id
- reservations.cancelled_by_staff_id → staff.id
- (+ 10 more existing FK constraints)

### Sample Data Loaded
✅ Users: 4 (all staff type)
✅ Staff: 4 (manager, housekeeper, front_desk, admin)
✅ Guests: 3 (walk-ins, no user accounts yet)
✅ Tasks: 4 (assigned to Jane Cleaner)
✅ Reservations: 2 (booked by John Manager)
✅ Room Occupancy: 5 records

### Sample Queries Tested
✅ Users joined with staff details
✅ Tasks with assigned staff names
✅ Reservations with guest and booking staff info
✅ Room availability search
✅ All foreign key relationships working

---

## Key Design Decisions

### 1. Separation of Authentication and Role Data
- **users** = login credentials and user type
- **staff** = employment details, role, department, compensation
- **guests** = booking history, preferences, contact details

### 2. Nullable user_id in staff and guests
- Allows data to exist independently of user accounts
- Staff can be created before account setup
- Guests can book without registration (walk-ins)

### 3. Staff-Specific References
- Tasks and reservations now reference `staff.id` directly
- More accurate than referencing generic `users.id`
- Prevents guests from being assigned tasks or booking on behalf of others

### 4. Renamed for Clarity
- `housekeeping_tasks` → `tasks` (broader scope, not just housekeeping)
- `assigned_user_id` → `assigned_staff_id` (explicit about staff relationship)

---

## Next Steps

### ⚠️ REQUIRED: Update API Endpoints (Task #22)

The following endpoints in `backend/src/server.ts` need to be updated to work with the new schema:

#### 1. Users Endpoints (lines 72-230)
**Current Issues:**
- Still using old User interface (name, role fields)
- Need to update to new fields (email, user_type, status)

**Actions Required:**
- Update GET /users - return new User interface
- Update GET /users/:id - return new User interface
- Update POST /users - accept new fields
- Update PUT /users/:id - accept new fields
- Update DELETE /users/:id - check dependencies

#### 2. Staff Endpoints (NEW)
**Actions Required:**
- Create GET /staff - list all staff
- Create GET /staff/:id - get staff by ID
- Create POST /staff - create new staff member (with optional user_id)
- Create PUT /staff/:id - update staff details
- Create DELETE /staff/:id - delete staff member

#### 3. Tasks Endpoints (lines 644-1030)
**Current Issues:**
- Still using DbHousekeepingTask and HousekeepingTask (should be DbTask and Task)
- References to assigned_user_id (should be assigned_staff_id)
- Route is still /housekeeping-tasks (should be /tasks)

**Actions Required:**
- Rename routes: /housekeeping-tasks → /tasks
- Update all references to DbHousekeepingTask → DbTask
- Update all references to HousekeepingTask → Task
- Update queries: assigned_user_id → assigned_staff_id
- Update joins: users → staff (for assigned staff name)

#### 4. Guests Endpoints (FUTURE)
**Actions Required:**
- Create CRUD endpoints for guests
- Support linking guests to user accounts via user_id

#### 5. Reservations Endpoints (FUTURE)
**Actions Required:**
- Create CRUD endpoints for reservations
- Update to use booked_by_staff_id and cancelled_by_staff_id
- Join with staff table for booking staff info

---

## TypeScript Compilation Status

**Current:** ❌ Fails (19 errors)
**Errors:** All related to outdated User and HousekeepingTask endpoint implementations

**Sample Errors:**
```
src/server.ts(194,9): error TS2322: Property 'userType' is missing in type '...' but required in type 'User'.
src/server.ts(797,34): error TS2304: Cannot find name 'DbHousekeepingTask'.
src/server.ts(867,27): error TS2304: Cannot find name 'HousekeepingTask'.
```

**Will be fixed by:** Completing Task #22 (Update server.ts endpoints)

---

## Testing Commands

### Reinitialize Database
```bash
cd backend
npx tsx src/dropTables.ts    # Drop all tables
npx tsx src/initSchema.ts    # Create new schema
npm run seed                 # Populate sample data
```

### Verify Schema
```bash
cd backend
npx tsx src/verifySchema.ts  # Run verification queries
```

### Build (will fail until endpoints updated)
```bash
cd backend
npm run build  # TypeScript compilation
```

---

## Migration Notes

### Breaking Changes
1. **users table** - Removed name and role columns
2. **Renamed table** - housekeeping_tasks → tasks
3. **Foreign keys** - Tasks now reference staff, not users
4. **Reservations** - booked_by/cancelled_by changed to booked_by_staff_id/cancelled_by_staff_id

### Data Migration (if needed on production)
If migrating existing data:
1. Create new staff records from old users table (where role = staff/manager/admin)
2. Link staff.user_id to corresponding users.id
3. Update tasks.assigned_staff_id from old assigned_user_id mapping
4. Update reservations staff IDs from old user ID mapping
5. Drop old columns after verification

---

## Summary

### ✅ Completed
- Database schema refactored with proper user/staff/guest separation
- All 10 tables created with correct relationships
- 15 foreign key constraints working correctly
- Sample data seeded successfully
- Verification queries passing
- TypeScript interfaces updated

### ⚠️ In Progress
- API endpoints need updating (Task #22)
  - Users endpoints (update to new schema)
  - Staff endpoints (create new CRUD)
  - Tasks endpoints (rename, update references)

### 📋 Future
- Guests CRUD endpoints
- Reservations CRUD endpoints
- Frontend integration
- Authentication implementation

**Status:** Database layer complete and fully tested. API layer needs updates before use. 🚀
