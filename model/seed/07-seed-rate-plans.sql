-- Seed data for rate_plans table
-- Creates standard hotel rate plans

INSERT INTO rate_plans (code, name, description, plan_type, cancellation_policy, min_nights, deposit_percentage, is_active, created_at, updated_at) VALUES
  ('STANDARD', 'Standard Rate', 'Regular nightly rate', 'standard', 'flexible', 1, 0.00, 1, NOW(), NOW()),
  ('WEEKEND', 'Weekend Special', 'Discounted rate for Friday-Sunday stays', 'promotional', 'flexible', 2, 0.00, 1, NOW(), NOW()),
  ('EXTENDED', 'Extended Stay', 'Special rate for stays of 7+ nights', 'promotional', 'moderate', 7, 10.00, 1, NOW(), NOW()),
  ('CORPORATE', 'Corporate Rate', 'Special rate for corporate bookings', 'corporate', 'flexible', 1, 0.00, 1, NOW(), NOW()),
  ('PROMO', 'Seasonal Promotion', 'Limited time promotional rate', 'seasonal', 'moderate', 1, 20.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
