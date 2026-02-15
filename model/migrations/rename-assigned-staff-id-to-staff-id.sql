-- Rename assigned_staff_id to staff_id and make it nullable
ALTER TABLE tasks
  CHANGE COLUMN assigned_staff_id staff_id INT NULL;
