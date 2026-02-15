# Database Migrations

This directory contains SQL migration files for database schema initialization and changes.

## Initial Schema (numbered files)

These files create the initial database schema. Run them in order:

1. **01-users.sql** - Creates users table for system authentication
2. **02-staff.sql** - Creates staff table for hotel employees
3. **03-room_types.sql** - Creates room_types table for room categories
4. **04-rooms.sql** - Creates rooms table for hotel rooms
5. **05-tasks.sql** - Creates tasks table for housekeeping tasks
6. **06-guests.sql** - Creates guests table for guest information
7. **07-rate_plans.sql** - Creates rate_plans table for pricing plans
8. **08-room_rates.sql** - Creates room_rates table for room pricing
9. **09-reservations.sql** - Creates reservations table for bookings
10. **10-room_occupancy.sql** - Creates room_occupancy table for room status tracking

## Schema Alterations

These migrations modify the existing schema:

### rename-assigned-staff-id-to-staff-id.sql
Renames the `assigned_staff_id` column to `staff_id` in the tasks table and makes it nullable.

### make-room-and-date-nullable.sql
Makes `room_id` and `task_date` columns nullable in the tasks table to allow tasks without assigned rooms or specific dates.

## Running Migrations

### Initial Setup
Run the numbered files (01-10) in order to create the initial schema.

### Schema Changes
Apply ALTER migrations after the initial schema is in place.

**Important:** Always backup your database before running migrations.

## Adding New Migrations

When adding new migrations:
1. For initial schema: Use numbered format (11-table_name.sql)
2. For alterations: Use descriptive filename (e.g., `add-status-column.sql`)
3. Write idempotent SQL when possible (using IF NOT EXISTS, etc.)
4. Test the migration on a development database first
5. Document the migration in this README
