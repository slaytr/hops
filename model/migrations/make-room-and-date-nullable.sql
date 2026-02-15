-- Make room_id and task_date nullable to allow tasks without assigned rooms
ALTER TABLE tasks
  MODIFY COLUMN room_id INT NULL,
  MODIFY COLUMN task_date DATE NULL;
