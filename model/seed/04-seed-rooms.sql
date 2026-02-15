-- Seed data for rooms table
-- Creates 30 rooms across 3 floors

INSERT INTO rooms (room_number, room_type_id, floor, status, created_at, updated_at)
SELECT
  room_number,
  (SELECT id FROM room_types WHERE name = room_type_name LIMIT 1) as room_type_id,
  floor,
  'available' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  -- Floor 1 (rooms 101-110)
  SELECT '101' as room_number, 'Standard Queen' as room_type_name, 1 as floor
  UNION ALL SELECT '102', 'Standard King', 1
  UNION ALL SELECT '103', 'Double Queen', 1
  UNION ALL SELECT '104', 'Standard Queen', 1
  UNION ALL SELECT '105', 'Standard King', 1
  UNION ALL SELECT '106', 'Accessible King', 1
  UNION ALL SELECT '107', 'Double Queen', 1
  UNION ALL SELECT '108', 'Standard Queen', 1
  UNION ALL SELECT '109', 'Standard King', 1
  UNION ALL SELECT '110', 'Deluxe King', 1

  -- Floor 2 (rooms 201-210)
  UNION ALL SELECT '201', 'Standard Queen', 2
  UNION ALL SELECT '202', 'Standard King', 2
  UNION ALL SELECT '203', 'Double Queen', 2
  UNION ALL SELECT '204', 'Standard Queen', 2
  UNION ALL SELECT '205', 'Deluxe King', 2
  UNION ALL SELECT '206', 'Standard King', 2
  UNION ALL SELECT '207', 'Double Queen', 2
  UNION ALL SELECT '208', 'Standard Queen', 2
  UNION ALL SELECT '209', 'Standard King', 2
  UNION ALL SELECT '210', 'Suite', 2

  -- Floor 3 (rooms 301-310)
  UNION ALL SELECT '301', 'Standard Queen', 3
  UNION ALL SELECT '302', 'Standard King', 3
  UNION ALL SELECT '303', 'Double Queen', 3
  UNION ALL SELECT '304', 'Deluxe King', 3
  UNION ALL SELECT '305', 'Standard Queen', 3
  UNION ALL SELECT '306', 'Standard King', 3
  UNION ALL SELECT '307', 'Suite', 3
  UNION ALL SELECT '308', 'Double Queen', 3
  UNION ALL SELECT '309', 'Deluxe King', 3
  UNION ALL SELECT '310', 'Suite', 3
) AS room_data
ON DUPLICATE KEY UPDATE updated_at = NOW();
