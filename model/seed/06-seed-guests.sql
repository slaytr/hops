-- Seed data for guests table
-- Creates sample guest profiles

INSERT INTO guests (first_name, last_name, email, phone, address_line1, city, state_province, country, postal_code, created_at, updated_at) VALUES
  ('James', 'Wilson', 'james.wilson@email.com', '555-1001', '123 Main St', 'New York', 'NY', 'USA', '10001', NOW(), NOW()),
  ('Emma', 'Thompson', 'emma.thompson@email.com', '555-1002', '456 Oak Ave', 'Los Angeles', 'CA', 'USA', '90001', NOW(), NOW()),
  ('Michael', 'Brown', 'michael.brown@email.com', '555-1003', '789 Pine Rd', 'Chicago', 'IL', 'USA', '60601', NOW(), NOW()),
  ('Sophia', 'Davis', 'sophia.davis@email.com', '555-1004', '321 Elm St', 'Houston', 'TX', 'USA', '77001', NOW(), NOW()),
  ('William', 'Martinez', 'william.martinez@email.com', '555-1005', '654 Maple Dr', 'Phoenix', 'AZ', 'USA', '85001', NOW(), NOW()),
  ('Olivia', 'Garcia', 'olivia.garcia@email.com', '555-1006', '987 Cedar Ln', 'Philadelphia', 'PA', 'USA', '19019', NOW(), NOW()),
  ('Alexander', 'Rodriguez', 'alex.rodriguez@email.com', '555-1007', '147 Birch Way', 'San Antonio', 'TX', 'USA', '78201', NOW(), NOW()),
  ('Isabella', 'Hernandez', 'isabella.h@email.com', '555-1008', '258 Spruce Ct', 'San Diego', 'CA', 'USA', '92101', NOW(), NOW()),
  ('Ethan', 'Lopez', 'ethan.lopez@email.com', '555-1009', '369 Willow Pl', 'Dallas', 'TX', 'USA', '75201', NOW(), NOW()),
  ('Ava', 'Gonzalez', 'ava.gonzalez@email.com', '555-1010', '741 Ash Blvd', 'San Jose', 'CA', 'USA', '95101', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
