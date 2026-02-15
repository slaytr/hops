-- Seed data for room_rates table
-- Creates rates for each room type and rate plan combination

INSERT IGNORE INTO room_rates (room_type_id, rate_plan_id, rate, effective_from, effective_to, created_at, updated_at)
SELECT
  rt.id as room_type_id,
  rp.id as rate_plan_id,
  rt.base_rate as rate,
  CURDATE() as effective_from,
  DATE_ADD(CURDATE(), INTERVAL 1 YEAR) as effective_to,
  NOW() as created_at,
  NOW() as updated_at
FROM room_types rt
CROSS JOIN rate_plans rp;
