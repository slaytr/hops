-- Master seed script
-- Runs all seed scripts in order
-- Usage: mysql -u username -p database_name < seed-all.sql

-- Note: This uses SOURCE command which requires absolute paths
-- Alternatively, run each script individually in order

-- Seed users
SOURCE 01-seed-users.sql;

-- Seed staff
SOURCE 02-seed-staff.sql;

-- Seed room types
SOURCE 03-seed-room-types.sql;

-- Seed rooms
SOURCE 04-seed-rooms.sql;

-- Seed tasks
SOURCE 05-seed-tasks.sql;

-- Seed guests
SOURCE 06-seed-guests.sql;

-- Seed rate plans
SOURCE 07-seed-rate-plans.sql;

-- Seed room rates
SOURCE 08-seed-room-rates.sql;

-- Seed reservations
SOURCE 09-seed-reservations.sql;

-- Seed room occupancy
SOURCE 10-seed-room-occupancy.sql;

SELECT 'Database seeded successfully!' as Status;
