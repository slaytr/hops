# Backend Migration to Sequelize ORM

**Date:** 2026-02-14
**Status:** ✅ Complete

## Overview

Successfully migrated the backend from raw SQL queries to using the Sequelize ORM models from the `@hops/models` library. The backend now utilizes type-safe ORM queries instead of raw SQL, improving code maintainability and type safety.

---

## Changes Made

### 1. Database Layer (`backend/src/db/index.ts`)

**Before:**
- Raw MySQL connection pool
- Custom `DbUser`, `DbStaff`, `DbRoomType`, etc. interfaces extending `RowDataPacket`
- Manual query methods: `db.query()`, `db.queryOne()`, `db.execute()`

**After:**
```typescript
import { initializeDatabase } from '@hops/models';

export const sequelize = initializeDatabase({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  database: process.env.MYSQL_DATABASE || 'hops',
  username: process.env.MYSQL_USER || 'hops_user',
  password: process.env.MYSQL_PASSWORD || 'hops_password',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Re-export all models and utilities
export {
  User, Staff, RoomType, Room, Task,
  Guest, RatePlan, RoomRate, Reservation, RoomOccupancy,
  getDatabase, closeDatabase, syncDatabase, testConnection
} from '@hops/models';
```

- Removed raw SQL connection pool
- Removed all custom `DbInterface` types
- Re-exports all Sequelize models from `@hops/models`

### 2. Server Endpoints (`backend/src/server.ts`)

#### Added Request Body Interfaces

```typescript
interface CreateStaffBody {
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  department?: string;
  employmentDate?: string;
  hourlyRate?: number;
  status?: string;
  notes?: string;
}

interface UpdateStaffBody extends Partial<CreateStaffBody> {}
// Similar interfaces for RoomType, Room, Task
```

#### Migrated All Endpoints

**Before (Raw SQL):**
```typescript
const dbUsers = await db.query<DbUser>('SELECT * FROM users ORDER BY created_at DESC');
const users: User[] = dbUsers.map(u => ({
  id: u.id.toString(),
  email: u.email,
  userType: u.user_type,
  status: u.status,
  createdAt: u.created_at.toISOString()
}));
```

**After (Sequelize):**
```typescript
const users = await User.findAll({
  order: [['created_at', 'DESC']],
  attributes: { exclude: ['password_hash'] }
});
return { users };
```

#### All Updated Endpoints:

**Users:**
- `GET /users` - `User.findAll()`
- `GET /users/:id` - `User.findByPk()`
- `POST /users` - `User.create()`
- `PUT /users/:id` - `user.update()`
- `DELETE /users/:id` - `user.destroy()`

**Staff:**
- `GET /staff` - `Staff.findAll({ include: [User] })`
- `GET /staff/:id` - `Staff.findByPk({ include: [User] })`
- `POST /staff` - `Staff.create()`
- `PUT /staff/:id` - `staff.update()` + `staff.reload()`
- `DELETE /staff/:id` - `staff.destroy()`

**Room Types:**
- `GET /room-types` - `RoomType.findAll()`
- `GET /room-types/:id` - `RoomType.findByPk()`
- `POST /room-types` - `RoomType.create()`
- `PUT /room-types/:id` - `roomType.update()`
- `DELETE /room-types/:id` - `roomType.destroy()`

**Rooms:**
- `GET /rooms` - `Room.findAll({ include: [RoomType] })`
- `GET /rooms/:id` - `Room.findByPk({ include: [RoomType] })`
- `POST /rooms` - `Room.create()` + `room.reload()`
- `PUT /rooms/:id` - `room.update()` + `room.reload()`
- `DELETE /rooms/:id` - `room.destroy()`

**Tasks:**
- `GET /tasks` - `Task.findAll({ include: [Room, Staff] })`
- `GET /tasks/:id` - `Task.findByPk({ include: [Room, Staff] })`
- `POST /tasks` - `Task.create()` + `task.reload()`
- `PUT /tasks/:id` - `task.update()` + `task.reload()`
- `DELETE /tasks/:id` - `task.destroy()`

### 3. Seed Script (`backend/src/seed.ts`)

**Before:**
- Raw SQL `INSERT` statements
- Manual SQL execution with `db.execute()`

**After:**
- Sequelize ORM methods
- `Model.findOrCreate()` for idempotent seeding
- Type-safe model creation

Example:
```typescript
const [user1] = await User.findOrCreate({
  where: { email: 'john.manager@hotel.com' },
  defaults: { user_type: 'staff', status: 'active' }
});

await Staff.findOrCreate({
  where: { user_id: user1.id },
  defaults: {
    first_name: 'John',
    last_name: 'Manager',
    role: 'manager',
    // ...
  }
});
```

### 4. Removed Files

Deleted old SQL utility files (no longer needed with Sequelize):
- `backend/src/db/connection.ts` - Raw MySQL pool
- `backend/src/dropTables.ts` - SQL schema drop script
- `backend/src/initSchema.ts` - SQL schema initialization
- `backend/src/verifySchema.ts` - SQL schema verification

---

## Benefits of Sequelize Migration

### 1. Type Safety
- Full TypeScript support with Sequelize models
- Compile-time type checking
- IntelliSense autocomplete in IDE
- No manual type mapping from database to API

### 2. Association Loading
```typescript
// Eager loading (automatic joins)
const staff = await Staff.findAll({
  include: [{ model: User, attributes: ['email'] }]
});

// Lazy loading
const task = await Task.findByPk(1);
const room = await task.getRoom();
const assignedStaff = await task.getAssignedStaff();
```

### 3. Cleaner Code
- No manual SQL string construction
- No manual parameter binding
- Automatic snake_case ↔ camelCase conversion (via models)
- Built-in error handling for constraints

### 4. Error Handling
```typescript
try {
  await User.create({ email, user_type, status });
} catch (error: any) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return reply.status(400).send({ error: "Email already exists" });
  }
  throw error;
}
```

Before, we had to check `error.code === 'ER_DUP_ENTRY'`.

### 5. Validation
- Model-level validation (defined in `@hops/models`)
- Automatic type coercion
- Required field validation

---

## Database Connection

The backend now uses Sequelize's connection pooling configured in the model library:

```typescript
pool: {
  max: 10,           // Maximum connections
  min: 0,            // Minimum connections
  acquire: 30000,    // Max time to acquire connection (ms)
  idle: 10000,       // Max idle time before release (ms)
}
```

Connection test on startup:
```typescript
const dbConnected = await testConnection();
if (!dbConnected) {
  throw new Error('Failed to connect to database');
}
```

---

## Migration Checklist

- ✅ Updated `backend/src/db/index.ts` to use Sequelize
- ✅ Migrated all User endpoints to Sequelize
- ✅ Migrated all Staff endpoints to Sequelize
- ✅ Migrated all RoomType endpoints to Sequelize
- ✅ Migrated all Room endpoints to Sequelize
- ✅ Migrated all Task endpoints to Sequelize
- ✅ Updated seed script to use Sequelize
- ✅ Removed old SQL utility files
- ✅ Added TypeScript request body interfaces
- ✅ Verified TypeScript compilation (0 errors)
- ✅ Removed raw MySQL connection pool

---

## Testing

### Compilation
```bash
# Model library
cd model && npm run build  # ✅ Success

# Backend
cd backend && npm run build  # ✅ Success
```

### Running the Server
```bash
cd backend
npm run dev  # Development with hot reload
npm start    # Production
```

### Seeding the Database
```bash
cd backend
npm run seed  # Uses Sequelize models
```

---

## Next Steps (Future Enhancements)

### 1. Add Remaining Endpoints
The following models are ready but don't have endpoints yet:
- Guest CRUD operations
- RatePlan CRUD operations
- RoomRate management
- Reservation booking workflow
- RoomOccupancy management

### 2. Add Sequelize Migrations
Consider using Sequelize migrations for schema versioning:
```bash
npx sequelize-cli migration:generate --name add-new-field
```

### 3. Add Model Hooks
Sequelize supports lifecycle hooks:
```typescript
User.beforeCreate((user) => {
  // Hash password before creating user
});
```

### 4. Add Validation
Add more robust validation in models:
```typescript
@Column({
  type: DataType.STRING(255),
  allowNull: false,
  validate: {
    isEmail: true,
    len: [3, 255]
  }
})
declare email: string;
```

### 5. Add Transactions
Wrap complex operations in transactions:
```typescript
const t = await sequelize.transaction();
try {
  await Reservation.create({ ... }, { transaction: t });
  await RoomOccupancy.bulkCreate([...], { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

---

## Summary

The backend has been successfully migrated from raw SQL to Sequelize ORM, providing:

- **Better type safety** - TypeScript integration
- **Cleaner code** - No manual SQL strings
- **Association loading** - Automatic joins via `include`
- **Easier testing** - Mock models instead of database
- **Better error handling** - Sequelize-specific error types
- **Consistent patterns** - All endpoints follow same structure

**The backend is now fully utilizing the `@hops/models` library!** 🚀
