-- Seed data for users table
-- Creates admin, manager, and staff users

INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at) VALUES
  -- Admin user
  ('admin@hops.com', '$2b$10$rF4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK', 'admin', 'active', NOW(), NOW()),

  -- Staff users
  ('manager@hops.com', '$2b$10$rF4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK', 'staff', 'active', NOW(), NOW()),
  ('front.desk@hops.com', '$2b$10$rF4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK9C5K4YQPh5jK', 'staff', 'active', NOW(), NOW()),
  ('maria.garcia@hops.com', NULL, 'staff', 'active', NOW(), NOW()),
  ('john.chen@hops.com', NULL, 'staff', 'active', NOW(), NOW()),
  ('sarah.johnson@hops.com', NULL, 'staff', 'active', NOW(), NOW()),
  ('david.kim@hops.com', NULL, 'staff', 'active', NOW(), NOW()),
  ('emily.rodriguez@hops.com', NULL, 'staff', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
