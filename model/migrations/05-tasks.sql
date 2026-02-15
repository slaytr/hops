-- Tasks Table Schema (MySQL)
-- Work tasks (cleaning, maintenance, inspection, etc.)
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  assigned_staff_id INT NOT NULL,
  task_date DATE NOT NULL,
  start_date_time TIMESTAMP NULL,
  end_date_time TIMESTAMP NULL,
  task_type ENUM('cleaning', 'maintenance', 'inspection', 'turndown') DEFAULT 'cleaning',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE RESTRICT,
  INDEX idx_tasks_room (room_id),
  INDEX idx_tasks_staff (assigned_staff_id),
  INDEX idx_tasks_date (task_date),
  INDEX idx_tasks_status (status),
  UNIQUE KEY unique_room_date_type (room_id, task_date, task_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
