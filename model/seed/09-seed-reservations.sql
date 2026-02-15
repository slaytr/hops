-- Seed data for reservations table
-- Creates sample reservations for the next 30 days

INSERT INTO reservations (confirmation_number, guest_id, room_id, room_type_id, rate_plan_id, check_in_date, check_out_date, adults, children, total_rate, status, notes, created_at, updated_at)
SELECT
  CONCAT('RES', LPAD(g.id, 6, '0'), LPAD(r.id, 3, '0')) as confirmation_number,
  g.id as guest_id,
  r.id as room_id,
  r.room_type_id,
  (SELECT id FROM rate_plans WHERE code = 'STANDARD' LIMIT 1) as rate_plan_id,
  DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY) as check_in_date,
  DATE_ADD(DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY), INTERVAL (2 + FLOOR(RAND() * 3)) DAY) as check_out_date,
  1 + FLOOR(RAND() * 2) as adults,
  FLOOR(RAND() * 2) as children,
  ROUND(rt.base_rate * (2 + FLOOR(RAND() * 3)), 2) as total_rate,
  CASE (FLOOR(1 + RAND() * 3))
    WHEN 1 THEN 'confirmed'
    WHEN 2 THEN 'checked_in'
    WHEN 3 THEN 'checked_out'
  END as status,
  'Seeded reservation' as notes,
  NOW() as created_at,
  NOW() as updated_at
FROM guests g
CROSS JOIN rooms r
JOIN room_types rt ON r.room_type_id = rt.id
ORDER BY RAND()
LIMIT 20
ON DUPLICATE KEY UPDATE updated_at = NOW();
