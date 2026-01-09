-- Migration: Add Notifications, Resources, and Live Classes features (Fixed)
-- Date: December 2, 2025
-- Note: Removes foreign key constraints on classes table (doesn't exist yet)

-- Create classes table first if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    division VARCHAR(50),
    year VARCHAR(20),
    department VARCHAR(100),
    academic_year VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    max_students INT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    url VARCHAR(500),
    subject VARCHAR(100) NOT NULL,
    class_id BIGINT,
    uploaded_by BIGINT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    download_count INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subject (subject),
    INDEX idx_type (type),
    INDEX idx_class (class_id),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create live_classes table
CREATE TABLE IF NOT EXISTS live_classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_id BIGINT,
    faculty_id BIGINT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    recording_url VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_faculty (faculty_id),
    INDEX idx_class (class_id),
    INDEX idx_scheduled (scheduled_at DESC),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample data for notifications
INSERT IGNORE INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT id, 'Welcome to Student Track System', 
       'New features: Real-time notifications, Resource Library, and Live Classes are now available!',
       'GENERAL', FALSE, NOW()
FROM users
WHERE id <= 5;

-- Verify tables were created
SELECT 'Classes table' as 'Table', COUNT(*) as 'Record Count' FROM classes
UNION ALL
SELECT 'Notifications table', COUNT(*) FROM notifications
UNION ALL
SELECT 'Resources table', COUNT(*) FROM resources
UNION ALL
SELECT 'Live Classes table', COUNT(*) FROM live_classes;
