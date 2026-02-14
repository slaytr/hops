-- Rate Plans Table Schema (MySQL)
CREATE TABLE IF NOT EXISTS rate_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type ENUM('standard', 'promotional', 'corporate', 'seasonal', 'package') DEFAULT 'standard',
  cancellation_policy ENUM('flexible', 'moderate', 'strict', 'non_refundable') DEFAULT 'flexible',
  min_nights INT DEFAULT 1,
  max_nights INT,
  advance_booking_required INT DEFAULT 0,
  deposit_percentage DECIMAL(5, 2) DEFAULT 0.00,
  deposit_required BOOLEAN DEFAULT FALSE,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rate_plans_code (code),
  INDEX idx_rate_plans_type (plan_type),
  INDEX idx_rate_plans_active (is_active),
  INDEX idx_rate_plans_validity (valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
