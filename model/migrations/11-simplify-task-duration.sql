-- Migration: Simplify task model to taskDate + duration (integer days)
-- Removes startDateTime and endDateTime columns, adds duration column

-- Step 1: Add duration column with default 1
ALTER TABLE tasks ADD COLUMN duration INT NOT NULL DEFAULT 1;

-- Step 2: Migrate existing data - calculate duration from startDateTime/endDateTime
UPDATE tasks
SET duration = GREATEST(1, DATEDIFF(DATE(end_date_time), DATE(start_date_time)) + 1)
WHERE start_date_time IS NOT NULL AND end_date_time IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE tasks DROP COLUMN start_date_time;
ALTER TABLE tasks DROP COLUMN end_date_time;
