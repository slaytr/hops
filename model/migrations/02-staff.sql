-- Staff Table Schema (MySQL)
-- Staff member details and employment information
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('housekeeper', 'front_desk', 'manager', 'admin', 'maintenance') NOT NULL,
  department VARCHAR(100),
  employment_date DATE,
  hourly_rate DECIMAL(10, 2),
  status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_staff_user (user_id),
  INDEX idx_staff_name (last_name, first_name),
  INDEX idx_staff_role (role),
  INDEX idx_staff_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
