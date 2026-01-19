CREATE DATABASE IF NOT EXISTS advanced_notes_db;
USE advanced_notes_db;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Review Modes Table
CREATE TABLE IF NOT EXISTS review_modes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    intervals_json JSON NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    content LONGTEXT,
    creation_date DATE,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Note Reviews Table (One-to-One with Notes)
CREATE TABLE IF NOT EXISTS note_reviews (
    note_id BIGINT PRIMARY KEY,
    mode_id VARCHAR(50),
    current_interval_index INT DEFAULT 0,
    next_review_date DATE,
    last_review_date DATE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (mode_id) REFERENCES review_modes(id) ON DELETE SET NULL
);

-- Insert Default Data
INSERT IGNORE INTO review_modes (id, name, description, intervals_json, is_system) VALUES 
('ebbinghaus_default', '艾宾浩斯 (系统推荐)', '基于经典遗忘曲线，适合长期记忆', '[1, 1, 2, 3, 5, 8, 15, 30, 60]', 1);

INSERT IGNORE INTO review_modes (id, name, description, intervals_json, is_system) VALUES 
('custom_weekly', '每周回顾', '每周一次，共复习4次', '[7, 7, 7, 7]', 1);

INSERT IGNORE INTO categories (id, name, parent_id) VALUES 
(1, '高数冲刺', NULL),
(2, '二重积分', NULL),
(3, '大营销项目', NULL);
-- Subcategory needs parent to exist first, ID 11 might not align with AUTO_INCREMENT if not forced.
-- For now, let's rely on auto increment or force IDs if we want to migrate data exactly.
