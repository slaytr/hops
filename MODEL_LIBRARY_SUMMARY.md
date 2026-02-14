# Sequelize Model Library Implementation

**Date:** 2026-02-14
**Status:** ✅ Complete - Ready for Backend Integration

## Overview

Successfully created a standalone Sequelize ORM model library in the `/model` directory. The library can be compiled and exported as `@hops/models` package for the backend to reference. All 10 database tables are now defined as Sequelize models with proper TypeScript typing and associations.

---

## Directory Structure

```
model/
├── package.json              # Model library package configuration
├── tsconfig.json             # TypeScript compiler configuration
├── src/
│   ├── config/
│   │   └── database.ts       # Sequelize connection configuration
│   ├── models/
│   │   ├── User.ts           # User model (authentication)
│   │   ├── Staff.ts          # Staff model (staff details)
│   │   ├── RoomType.ts       # Room type model
│   │   ├── Room.ts           # Room model
│   │   ├── Task.ts           # Task model (formerly housekeeping_tasks)
│   │   ├── Guest.ts          # Guest model
│   │   ├── RatePlan.ts       # Rate plan model
│   │   ├── RoomRate.ts       # Room rate model
│   │   ├── Reservation.ts    # Reservation model
│   │   └── RoomOccupancy.ts  # Room occupancy model
│   ├── index.ts              # Main export file
│   └── sync.ts               # Database sync utility
├── dist/                     # Compiled JavaScript output
└── *.sql                     # SQL schema files (kept for reference)
```

---

## Package Configuration

### package.json
```json
{
  "name": "@hops/models",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module"
}
```

### Key Dependencies
- `sequelize` (^6.37.1) - ORM framework
- `sequelize-typescript` (^2.1.6) - TypeScript decorators
- `mysql2` (^3.17.1) - MySQL driver

---

## Model Definitions

All models use `sequelize-typescript` decorators for clean, type-safe definitions.

### Example: User Model

```typescript
import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.ENUM('staff', 'guest'),
    allowNull: false,
  })
  declare user_type: 'staff' | 'guest';

  // ... other fields

  // Associations
  @HasOne(() => Staff, 'user_id')
  declare staff?: Staff;

  @HasOne(() => Guest, 'user_id')
  declare guest?: Guest;
}
```

---

## Model Associations

All foreign key relationships are properly defined using Sequelize decorators:

### One-to-One Relationships
- `User` ↔ `Staff` (user_id)
- `User` ↔ `Guest` (user_id)

### One-to-Many Relationships
- `RoomType` → `Room` (room_type_id)
- `RoomType` → `RoomRate` (room_type_id)
- `RoomType` → `Reservation` (room_type_id)
- `Room` → `Task` (room_id)
- `Room` → `Reservation` (room_id)
- `Room` → `RoomOccupancy` (room_id)
- `Staff` → `Task` (assigned_staff_id)
- `Staff` → `Reservation` (booked_by_staff_id, cancelled_by_staff_id)
- `Guest` → `Reservation` (guest_id)
- `RatePlan` → `RoomRate` (rate_plan_id)
- `RatePlan` → `Reservation` (rate_plan_id)
- `Reservation` → `RoomOccupancy` (reservation_id)

### Example Association Definitions

```typescript
// In Room.ts
@BelongsTo(() => RoomType, 'room_type_id')
declare room_type?: RoomType;

@HasMany(() => Task, 'room_id')
declare tasks?: Task[];

// In RoomType.ts
@HasMany(() => Room, 'room_type_id')
declare rooms?: Room[];
```

---

## Exported API

### Main Exports (from `src/index.ts`)

```typescript
// Models
export { User } from './models/User.js';
export { Staff } from './models/Staff.js';
export { RoomType } from './models/RoomType.js';
export { Room } from './models/Room.js';
export { Task } from './models/Task.js';
export { Guest } from './models/Guest.js';
export { RatePlan } from './models/RatePlan.js';
export { RoomRate } from './models/RoomRate.js';
export { Reservation } from './models/Reservation.js';
export { RoomOccupancy } from './models/RoomOccupancy.js';

// Configuration
export { DatabaseConfig, defaultConfig } from './config/database.js';

// Database functions
export function initializeDatabase(config?: DatabaseConfig): Sequelize;
export function getDatabase(): Sequelize;
export function closeDatabase(): Promise<void>;
export function syncDatabase(options?: { force?: boolean; alter?: boolean }): Promise<void>;
export function testConnection(): Promise<boolean>;
```

---

## Usage in Backend

### Installation

The backend package.json now includes:
```json
"dependencies": {
  "@hops/models": "file:../model",
  ...
}
```

### Basic Usage

```typescript
import {
  initializeDatabase,
  User,
  Staff,
  Room,
  Task
} from '@hops/models';

// Initialize database connection
initializeDatabase({
  host: process.env.DB_HOST,
  port: parseInt(process.env.MYSQL_PORT),
  database: process.env.MYSQL_DATABASE,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  dialect: 'mysql',
});

// Query examples
const users = await User.findAll();
const staff = await Staff.findAll({ include: [User] });
const tasks = await Task.findAll({
  include: [Room, Staff],
  where: { status: 'pending' }
});
```

### Advanced Queries with Associations

```typescript
// Get reservations with guest and room info
const reservations = await Reservation.findAll({
  include: [
    { model: Guest },
    { model: Room, include: [RoomType] },
    { model: RatePlan },
    { model: Staff, as: 'booked_by_staff' }
  ],
  where: { status: 'confirmed' }
});

// Get room with all tasks
const room = await Room.findOne({
  where: { room_number: '101' },
  include: [
    { model: RoomType },
    { model: Task, include: [Staff] }
  ]
});
```

---

## Build and Sync Commands

### Build Model Library
```bash
cd model
npm run build        # Compile TypeScript to dist/
npm run watch        # Watch mode for development
npm run clean        # Remove dist/ folder
```

### Database Sync
```bash
cd model
npm run sync         # Sync models to database (using alter mode)
```

**Note:** The sync utility uses `sequelize.sync({ alter: false })` which will NOT automatically alter the database schema. The SQL files are still the source of truth for schema changes.

---

## Virtual Columns in Reservation Model

The Reservation model includes virtual columns for calculated fields:

```typescript
@Column({
  type: DataType.VIRTUAL(DataType.INTEGER),
  get() {
    const checkIn = this.getDataValue('check_in_date');
    const checkOut = this.getDataValue('check_out_date');
    if (checkIn && checkOut) {
      const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return 0;
  },
})
declare nights: number;

@Column({
  type: DataType.VIRTUAL(DataType.DECIMAL(10, 2)),
  get() {
    const total = parseFloat(this.getDataValue('total_rate') || '0');
    const tax = parseFloat(this.getDataValue('tax_amount') || '0');
    return (total + tax).toFixed(2);
  },
})
declare total_amount: string;

@Column({
  type: DataType.VIRTUAL(DataType.DECIMAL(10, 2)),
  get() {
    const total = parseFloat(this.getDataValue('total_rate') || '0');
    const tax = parseFloat(this.getDataValue('tax_amount') || '0');
    const deposit = parseFloat(this.getDataValue('deposit_paid') || '0');
    return (total + tax - deposit).toFixed(2);
  },
})
declare balance_due: string;
```

These match the MySQL generated columns but are calculated in JavaScript for Sequelize.

---

## Configuration

### Database Config (src/config/database.ts)

```typescript
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'mysql';
  logging?: boolean | ((sql: string) => void);
}

export const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  database: process.env.MYSQL_DATABASE || 'hops_db',
  username: process.env.MYSQL_USER || 'hops_user',
  password: process.env.MYSQL_PASSWORD || 'hops_password',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};
```

### Connection Pool Settings

```typescript
pool: {
  max: 10,           // Maximum connections
  min: 0,            // Minimum connections
  acquire: 30000,    // Max time to acquire connection (ms)
  idle: 10000,       // Max idle time before release (ms)
}
```

---

## Migration from Raw SQL to Sequelize

### Before (Raw SQL in backend/src/db/index.ts)
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

### After (Sequelize Models)
```typescript
import { User } from '@hops/models';

const users = await User.findAll({
  order: [['created_at', 'DESC']]
});

// Models already have proper TypeScript types
// No manual mapping needed
```

---

## Benefits of Sequelize Models

### 1. Type Safety
- Full TypeScript support with decorators
- Compile-time type checking
- IntelliSense support in IDE

### 2. Association Loading
```typescript
// Eager loading
const tasks = await Task.findAll({
  include: [Room, Staff]  // Automatically joins
});

// Lazy loading
const task = await Task.findByPk(1);
const room = await task.getRoom();  // Lazy load room
const staff = await task.getAssignedStaff();  // Lazy load staff
```

### 3. Query Builder
```typescript
const tasks = await Task.findAll({
  where: {
    status: 'pending',
    priority: { [Op.in]: ['high', 'urgent'] },
    task_date: { [Op.gte]: new Date() }
  },
  include: [
    { model: Room, where: { floor: 2 } },
    { model: Staff, where: { role: 'housekeeper' } }
  ],
  order: [['priority', 'DESC'], ['task_date', 'ASC']],
  limit: 10
});
```

### 4. Transactions
```typescript
const t = await sequelize.transaction();

try {
  const reservation = await Reservation.create({
    guest_id: 1,
    room_type_id: 2,
    // ...
  }, { transaction: t });

  await RoomOccupancy.bulkCreate([
    { room_id: 5, reservation_id: reservation.id, occupancy_date: '2026-03-01' },
    { room_id: 5, reservation_id: reservation.id, occupancy_date: '2026-03-02' },
  ], { transaction: t });

  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

### 5. Validation
```typescript
@Column({
  type: DataType.STRING(255),
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true
  }
})
declare email: string;
```

---

## Next Steps for Backend Integration

### 1. Update Database Connection (backend/src/db/index.ts)
```typescript
import { initializeDatabase, getDatabase } from '@hops/models';

// Initialize on startup
initializeDatabase();

// Export for use in server.ts
export { getDatabase };
export * from '@hops/models';
```

### 2. Update Endpoints to Use Models

**Before:**
```typescript
const dbUsers = await db.query<DbUser>('SELECT * FROM users ORDER BY created_at DESC');
```

**After:**
```typescript
import { User } from '@hops/models';
const users = await User.findAll({ order: [['created_at', 'DESC']] });
```

### 3. Update Seed Script
```typescript
import { User, Staff, RoomType, Room, Task } from '@hops/models';

// Create with Sequelize
await User.bulkCreate([
  { email: 'john@hotel.com', user_type: 'staff' },
  { email: 'jane@hotel.com', user_type: 'staff' },
]);

const users = await User.findAll();
await Staff.bulkCreate([
  { user_id: users[0].id, first_name: 'John', last_name: 'Manager', role: 'manager' },
  { user_id: users[1].id, first_name: 'Jane', last_name: 'Cleaner', role: 'housekeeper' },
]);
```

---

## Comparison: SQL Files vs Sequelize Models

### SQL Files (Kept in /model for reference)
- ✅ Source of truth for production schema
- ✅ Used for initial database setup
- ✅ Version controlled schema changes
- ❌ No TypeScript types
- ❌ Manual joins required
- ❌ Raw SQL in application code

### Sequelize Models (New /model/src)
- ✅ Type-safe ORM with TypeScript
- ✅ Automatic joins via associations
- ✅ Query builder
- ✅ Transaction support
- ✅ Validation
- ✅ Easier testing (can mock models)
- ❌ Requires sync with SQL schema

---

## Testing

### Unit Tests with Sequelize Models
```typescript
import { User, Staff } from '@hops/models';

describe('Staff Model', () => {
  it('should create staff with user', async () => {
    const user = await User.create({
      email: 'test@test.com',
      user_type: 'staff'
    });

    const staff = await Staff.create({
      user_id: user.id,
      first_name: 'Test',
      last_name: 'User',
      role: 'manager'
    });

    expect(staff.first_name).toBe('Test');
    const loadedUser = await staff.getUser();
    expect(loadedUser?.email).toBe('test@test.com');
  });
});
```

---

## Summary

### ✅ Completed
- Created standalone model library in `/model`
- Defined all 10 models with Sequelize decorators
- Set up all associations and relationships
- Configured TypeScript compilation
- Created database utilities (sync, init, close)
- Exported as `@hops/models` package
- Installed in backend via `file:../model`

### 📦 Model Library Features
- Type-safe Sequelize models
- Full association support
- Virtual columns for calculated fields
- Database connection management
- Sync utilities
- Compiled and ready for import

### 🔜 Next Steps
- Update backend endpoints to use Sequelize models instead of raw SQL
- Update seed script to use models
- Add tests for models
- Consider adding Sequelize migrations for schema versioning

**The model library is complete and ready for backend integration!** 🚀
