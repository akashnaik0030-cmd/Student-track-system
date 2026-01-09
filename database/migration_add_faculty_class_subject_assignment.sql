-- Migration: Add Faculty-Class-Subject Assignment System
-- This allows HOD to assign faculty to teach specific subjects in specific classes

-- Create faculty_class_subjects table
CREATE TABLE IF NOT EXISTS faculty_class_subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    faculty_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    assigned_by_id BIGINT,
    assigned_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_fcs_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fcs_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT uk_faculty_class_subject UNIQUE (faculty_id, class_id, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indexes for better query performance
CREATE INDEX idx_fcs_faculty_id ON faculty_class_subjects(faculty_id);
CREATE INDEX idx_fcs_class_id ON faculty_class_subjects(class_id);
CREATE INDEX idx_fcs_subject ON faculty_class_subjects(subject);
CREATE INDEX idx_fcs_is_active ON faculty_class_subjects(is_active);

-- Add subjects column to classes table (comma-separated list of subjects offered)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS subjects TEXT;

-- Sample data: Add common subjects to existing classes
UPDATE classes SET subjects = 'Mathematics,Physics,Chemistry,English,Computer Science' WHERE department = 'Computer Science' AND subjects IS NULL;
UPDATE classes SET subjects = 'Mathematics,Physics,Electronics,English,Digital Systems' WHERE department = 'Electronics' AND subjects IS NULL;
UPDATE classes SET subjects = 'Mathematics,Physics,Mechanics,English,Manufacturing' WHERE department = 'Mechanical Engineering' AND subjects IS NULL;

-- Insert sample faculty-class-subject assignments (if data exists)
-- Example: Assign faculty1 to teach Computer Science in class with id=1
INSERT IGNORE INTO faculty_class_subjects (faculty_id, class_id, subject, assigned_at, is_active)
SELECT 
    u.id as faculty_id,
    c.id as class_id,
    'Computer Science' as subject,
    NOW() as assigned_at,
    TRUE as is_active
FROM users u
CROSS JOIN classes c
WHERE u.username = 'faculty1' 
AND c.name LIKE 'Computer Science%'
LIMIT 1;
