-- Add subjects column to classes table
ALTER TABLE classes ADD COLUMN subjects VARCHAR(500) NULL COMMENT 'Comma-separated list of subjects for this class';

-- Create faculty_class_subjects table for many-to-many relationship
CREATE TABLE IF NOT EXISTS faculty_class_subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    faculty_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_class_subject (faculty_id, class_id, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create index for better performance
CREATE INDEX idx_faculty_class_subjects_faculty ON faculty_class_subjects(faculty_id);
CREATE INDEX idx_faculty_class_subjects_class ON faculty_class_subjects(class_id);
