-- Migration: Add multi-class support to Student Track System
-- Description: Adds Class table and relationships for managing multiple classes

-- Step 1: Create Class table
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    division VARCHAR(50),
    year VARCHAR(20),
    department VARCHAR(100),
    academic_year VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 2: Add class_id to users table
ALTER TABLE users 
ADD COLUMN class_id BIGINT,
ADD CONSTRAINT fk_user_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Step 3: Add class_id to tasks table (optional - for class-specific tasks)
ALTER TABLE tasks 
ADD COLUMN class_id BIGINT,
ADD CONSTRAINT fk_task_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Step 4: Insert sample classes
INSERT INTO classes (name, division, year, department, academic_year, is_active) VALUES
('TE Computer A', 'A', 'Third Year', 'Computer Engineering', '2024-25', TRUE),
('TE Computer B', 'B', 'Third Year', 'Computer Engineering', '2024-25', TRUE),
('BE Computer A', 'A', 'Final Year', 'Computer Engineering', '2024-25', TRUE),
('SE Computer A', 'A', 'Second Year', 'Computer Engineering', '2024-25', TRUE);

-- Step 5: Update existing students with default class (TE Computer A)
-- This assigns all current students to the first class
UPDATE users 
SET class_id = (SELECT id FROM classes WHERE name = 'TE Computer A' LIMIT 1)
WHERE id IN (SELECT u.id FROM users u 
             INNER JOIN user_roles ur ON u.id = ur.user_id
             INNER JOIN roles r ON ur.role_id = r.id
             WHERE r.name = 'ROLE_STUDENT');

-- Step 6: Create index for faster queries
CREATE INDEX idx_users_class_id ON users(class_id);
CREATE INDEX idx_tasks_class_id ON tasks(class_id);

-- Step 7: Add comments for documentation
ALTER TABLE classes COMMENT = 'Stores class/division information for organizing students';
ALTER TABLE users MODIFY COLUMN class_id BIGINT COMMENT 'Foreign key to classes table - which class the student belongs to';
ALTER TABLE tasks MODIFY COLUMN class_id BIGINT COMMENT 'Optional: Tasks can be assigned to specific classes';
