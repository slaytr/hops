-- Seed data for tasks table
-- Creates sample housekeeping and maintenance tasks

INSERT INTO tasks (room_id, staff_id, task_type, task_date, start_date_time, end_date_time, priority, status, notes, created_at, updated_at)
SELECT
  r.id as room_id,
  (SELECT id FROM staff ORDER BY RAND() LIMIT 1) as staff_id,
  CASE (FLOOR(1 + RAND() * 4))
    WHEN 1 THEN 'cleaning'
    WHEN 2 THEN 'inspection'
    WHEN 3 THEN 'maintenance'
    WHEN 4 THEN 'turndown'
  END as task_type,
  CURDATE() as task_date,
  CONCAT(CURDATE(), ' 09:00:00') as start_date_time,
  CONCAT(CURDATE(), ' 17:00:00') as end_date_time,
  CASE (FLOOR(1 + RAND() * 3))
    WHEN 1 THEN 'low'
    WHEN 2 THEN 'medium'
    WHEN 3 THEN 'high'
  END as priority,
  'pending' as status,
  'Seeded task data' as notes,
  NOW() as created_at,
  NOW() as updated_at
FROM rooms r
LIMIT 15
ON DUPLICATE KEY UPDATE updated_at = NOW();
