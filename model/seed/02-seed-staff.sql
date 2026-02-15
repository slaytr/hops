-- Seed data for staff table
-- Creates housekeeping and maintenance staff

INSERT INTO staff (user_id, first_name, last_name, phone, role, department, employment_date, status, created_at, updated_at)
SELECT
  u.id,
  CASE u.email
    WHEN 'maria.garcia@hops.com' THEN 'Maria'
    WHEN 'john.chen@hops.com' THEN 'John'
    WHEN 'sarah.johnson@hops.com' THEN 'Sarah'
    WHEN 'david.kim@hops.com' THEN 'David'
    WHEN 'emily.rodriguez@hops.com' THEN 'Emily'
  END as first_name,
  CASE u.email
    WHEN 'maria.garcia@hops.com' THEN 'Garcia'
    WHEN 'john.chen@hops.com' THEN 'Chen'
    WHEN 'sarah.johnson@hops.com' THEN 'Johnson'
    WHEN 'david.kim@hops.com' THEN 'Kim'
    WHEN 'emily.rodriguez@hops.com' THEN 'Rodriguez'
  END as last_name,
  CASE u.email
    WHEN 'maria.garcia@hops.com' THEN '555-0101'
    WHEN 'john.chen@hops.com' THEN '555-0102'
    WHEN 'sarah.johnson@hops.com' THEN '555-0103'
    WHEN 'david.kim@hops.com' THEN '555-0104'
    WHEN 'emily.rodriguez@hops.com' THEN '555-0105'
  END as phone,
  CASE u.email
    WHEN 'maria.garcia@hops.com' THEN 'housekeeper'
    WHEN 'john.chen@hops.com' THEN 'housekeeper'
    WHEN 'sarah.johnson@hops.com' THEN 'maintenance'
    WHEN 'david.kim@hops.com' THEN 'housekeeper'
    WHEN 'emily.rodriguez@hops.com' THEN 'front_desk'
  END as role,
  'Operations' as department,
  DATE_SUB(NOW(), INTERVAL 180 DAY) as employment_date,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
WHERE u.email IN (
  'maria.garcia@hops.com',
  'john.chen@hops.com',
  'sarah.johnson@hops.com',
  'david.kim@hops.com',
  'emily.rodriguez@hops.com'
)
ON DUPLICATE KEY UPDATE updated_at = NOW();
