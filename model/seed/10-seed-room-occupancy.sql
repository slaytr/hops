-- Seed data for room_occupancy table
-- Creates current occupancy status for all rooms

INSERT INTO room_occupancy (room_id, occupancy_date, status, reservation_id, created_at, updated_at)
SELECT
  r.id as room_id,
  CURDATE() as occupancy_date,
  CASE (FLOOR(1 + RAND() * 4))
    WHEN 1 THEN 'available'
    WHEN 2 THEN 'occupied'
    WHEN 3 THEN 'blocked'
    WHEN 4 THEN 'maintenance'
  END as status,
  NULL as reservation_id,
  NOW() as created_at,
  NOW() as updated_at
FROM rooms r
ON DUPLICATE KEY UPDATE updated_at = NOW();
