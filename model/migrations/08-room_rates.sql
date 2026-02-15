-- Room Rates Table Schema (MySQL)
CREATE TABLE IF NOT EXISTS room_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_type_id INT NOT NULL,
  rate_plan_id INT NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  day_of_week ENUM('all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') DEFAULT 'all',
  extra_person_rate DECIMAL(10, 2) DEFAULT 0.00,
  extra_child_rate DECIMAL(10, 2) DEFAULT 0.00,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id) ON DELETE RESTRICT,
  INDEX idx_room_rates_type (room_type_id),
  INDEX idx_room_rates_plan (rate_plan_id),
  INDEX idx_room_rates_day (day_of_week),
  INDEX idx_room_rates_effective (effective_from, effective_to),
  INDEX idx_room_rates_lookup (room_type_id, rate_plan_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
