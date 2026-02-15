# Database Seed Scripts

This directory contains SQL scripts to populate the database with sample data for development and testing.

## Seed Files

### Individual Seed Scripts (Run in Order)

1. **01-seed-users.sql** - Creates admin, manager, and staff users (8 users)
2. **02-seed-staff.sql** - Creates staff records for housekeeping and maintenance personnel (5 staff)
3. **03-seed-room-types.sql** - Creates standard hotel room types (6 types)
4. **04-seed-rooms.sql** - Creates 30 rooms across 3 floors
5. **05-seed-tasks.sql** - Creates sample housekeeping tasks (15 tasks)
6. **06-seed-guests.sql** - Creates sample guest profiles (10 guests)
7. **07-seed-rate-plans.sql** - Creates rate plans with discounts (7 plans)
8. **08-seed-room-rates.sql** - Creates rates for all room type/rate plan combinations
9. **09-seed-reservations.sql** - Creates sample reservations (20 reservations)
10. **10-seed-room-occupancy.sql** - Creates current room occupancy status for all rooms

### Master Script

- **seed-all.sql** - Runs all seed scripts in order (uses SOURCE command)

## Running Seed Scripts

### Option 1: Run All Seeds at Once

From the seed directory:
```bash
mysql -u hops_user -p hops_db < seed-all.sql
```

### Option 2: Run Individual Scripts

```bash
mysql -u hops_user -p hops_db < 01-seed-users.sql
mysql -u hops_user -p hops_db < 02-seed-staff.sql
# ... continue with remaining scripts
```

### Option 3: Using Docker

If using Docker, run from the project root:
```bash
docker exec -i hops-mysql mysql -uhops_user -phops_password hops_db < model/seed/seed-all.sql
```

Or run individual scripts:
```bash
docker exec -i hops-mysql mysql -uhops_user -phops_password hops_db < model/seed/01-seed-users.sql
```

## Important Notes

### Data Safety
- All seed scripts use `ON DUPLICATE KEY UPDATE` to avoid duplicate entries
- Safe to run multiple times - will update existing records instead of creating duplicates
- **Always backup your database before running seed scripts on production data**

### Passwords
- User passwords in `01-seed-users.sql` are hashed placeholders
- In production, use proper password hashing
- Default password hash shown is for demonstration only

### Randomized Data
- Some scripts (tasks, reservations, room occupancy) use `RAND()` for variety
- Data will be slightly different each time you run the seed
- Dates are relative to `CURDATE()` so they stay current

### Dependencies
- Scripts must be run in numerical order due to foreign key constraints
- For example: `02-seed-staff.sql` requires users from `01-seed-users.sql`
- `04-seed-rooms.sql` requires room types from `03-seed-room-types.sql`

## Clearing Seed Data

To remove all data and start fresh:

```sql
-- Warning: This deletes ALL data!
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE room_occupancy;
TRUNCATE TABLE reservations;
TRUNCATE TABLE room_rates;
TRUNCATE TABLE rate_plans;
TRUNCATE TABLE tasks;
TRUNCATE TABLE rooms;
TRUNCATE TABLE room_types;
TRUNCATE TABLE guests;
TRUNCATE TABLE staff;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

Then re-run the migrations and seed scripts.

## Customizing Seed Data

Feel free to modify the seed scripts to match your development needs:
- Adjust the number of rooms, guests, or reservations
- Change default values (prices, dates, names, etc.)
- Add or remove sample data

After making changes, increment the model package version and rebuild:
```bash
cd model
npm version patch
npm run build
cd ../backend
npm install
```
