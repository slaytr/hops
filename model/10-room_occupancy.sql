-- Room Occupancy Table Schema (MySQL)
CREATE TABLE IF NOT EXISTS room_occupancy (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  reservation_id INT,
  occupancy_date DATE NOT NULL,
  status ENUM('available', 'occupied', 'blocked', 'maintenance') DEFAULT 'occupied',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_room_date (room_id, occupancy_date),
  INDEX idx_occupancy_date (occupancy_date),
  INDEX idx_occupancy_reservation (reservation_id),
  INDEX idx_occupancy_status (status),
  INDEX idx_occupancy_lookup (room_id, occupancy_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
