-- Seed data for room_types table
-- Creates standard hotel room types

INSERT INTO room_types (name, description, base_rate, max_occupancy, created_at, updated_at) VALUES
  ('Standard Queen', 'Comfortable room with one queen bed', 129.99, 2, NOW(), NOW()),
  ('Standard King', 'Spacious room with one king bed', 149.99, 2, NOW(), NOW()),
  ('Double Queen', 'Room with two queen beds, perfect for families', 169.99, 4, NOW(), NOW()),
  ('Deluxe King', 'Premium room with king bed and sitting area', 199.99, 2, NOW(), NOW()),
  ('Suite', 'Luxurious suite with separate living area', 299.99, 4, NOW(), NOW()),
  ('Accessible King', 'ADA compliant room with king bed', 149.99, 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
