-- TrackeBack Database Schema
-- MySQL Database for Lost & Found Items System

-- Drop existing tables if they exist
DROP TABLE IF EXISTS security_questions;
DROP TABLE IF EXISTS found_items;
DROP TABLE IF EXISTS lost_items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table (Kent State Campus locations)
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    building_code VARCHAR(20),
    category VARCHAR(100),
    description TEXT,
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    phone VARCHAR(20),
    student_id VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lost items table
CREATE TABLE lost_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    location_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    brand VARCHAR(100),
    material VARCHAR(100),
    distinguishing_features TEXT,
    image_url VARCHAR(500),
    date_lost DATE NOT NULL,
    time_lost TIME,
    reward_offered DECIMAL(10, 2) DEFAULT 0.00,
    contact_preference ENUM('email', 'phone', 'both') DEFAULT 'both',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    INDEX idx_category (category_id),
    INDEX idx_location (location_id),
    INDEX idx_date_lost (date_lost),
    INDEX idx_is_resolved (is_resolved)
);

-- Found items table
CREATE TABLE found_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    location_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    brand VARCHAR(100),
    material VARCHAR(100),
    distinguishing_features TEXT,
    image_url VARCHAR(500),
    date_found DATE NOT NULL,
    time_found TIME,
    current_location VARCHAR(300), -- Where the item is being kept
    finder_notes TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    privacy_expires_at TIMESTAMP NOT NULL, -- 30 days from found date
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP NULL,
    claimed_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_location (location_id),
    INDEX idx_date_found (date_found),
    INDEX idx_is_private (is_private),
    INDEX idx_privacy_expires (privacy_expires_at),
    INDEX idx_is_claimed (is_claimed)
);

-- Security questions for found items
CREATE TABLE security_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    found_item_id INT NOT NULL,
    question TEXT NOT NULL,
    answer VARCHAR(200) NOT NULL, -- Store as lowercase for comparison
    question_type ENUM('text', 'number', 'yesno') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (found_item_id) REFERENCES found_items(id) ON DELETE CASCADE,
    INDEX idx_found_item (found_item_id)
);