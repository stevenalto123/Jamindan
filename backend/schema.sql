-- Jamindan Emergency Response Community Platform Database Schema
-- Compatible with MySQL (phpMyAdmin / XAMPP)

CREATE DATABASE IF NOT EXISTS `jamindan_emergency` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jamindan_emergency`;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL, -- 'Admin', 'Responder', 'Resident'
  `full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `barangay` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `is_active` TINYINT DEFAULT 1, -- 1 = active, 0 = deactivated
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: incidents
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL, -- Format: #YYYY-MM-XXXX
  `reporter_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL, -- 'Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other'
  `description` TEXT NOT NULL,
  `photo_path` VARCHAR(255) NULL,
  `location_lat` DOUBLE NULL,
  `location_lng` DOUBLE NULL,
  `status` VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Under Review', 'In Progress', 'Resolved'
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: incident_status_history
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `incident_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `incident_id` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `comment` TEXT NULL,
  `updated_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: news
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- 'News', 'Announcements', 'Advisories'
  `image_path` VARCHAR(255) NULL,
  `author_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT DEFAULT 0, -- 0 = unread, 1 = read
  `reference_type` VARCHAR(50) NULL, -- 'incident', 'news'
  `reference_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: audit_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` TEXT NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `ip` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Default Test Accounts Seeding
-- Passwords: AdminPass123!, ResponderPass123!, ResidentPass123!
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `phone`, `barangay`, `avatar`, `is_active`) VALUES
(1, 'admin', '$2a$10$7zBv4lpxU8/WkP295bY6d.cQ/Q2G2o3r11D256789ABCDE1234567', 'Admin', 'Platform Administrator', '09171234567', 'Poblacion', NULL, 1),
(2, 'responder', '$2a$10$7zBv4lpxU8/WkP295bY6d.eQ/Q2G2o3r11D256789ABCDE1234567', 'Responder', 'Jamindan Municipal Responder', '09187654321', 'Lucero', NULL, 1),
(3, 'resident', '$2a$10$7zBv4lpxU8/WkP295bY6d.fQ/Q2G2o3r11D256789ABCDE1234567', 'Resident', 'Juan Dela Cruz', '09199876543', 'Agloloway', NULL, 1)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Note: The bcrypt hashes above are placeholders and will be properly encrypted on startup if seeded programmatically.

-- --------------------------------------------------------
-- Seeding News and Announcements
-- --------------------------------------------------------
INSERT INTO `news` (`id`, `title`, `content`, `category`, `author_id`) VALUES
(1, 'Typhoon Warning: Stay Indoors and Monitor Water Levels', 'Tropical Cyclone Pepito is expected to bring heavy rains in Capiz and Panay island. The Mambusao River water level is being monitored closely. Please stay indoors, stock up on essential supplies, and contact the Jamindan Disaster Risk Reduction Management Office (MDRRMO) for immediate emergencies.', 'Advisories', 1),
(2, 'Community Basic First Aid & Rescue Seminar', 'The Municipality of Jamindan is hosting a community basic life support and first aid seminar on Friday, October 16, 2026, at the Municipal Covered Gym. All Barangay Responders and volunteer residents are encouraged to attend. Certificates will be provided.', 'Announcements', 1),
(3, 'LGU Jamindan Launches New Digital Response Service', 'LGU Jamindan has officially launched the Emergency Response Community Platform, bringing instant digital incident reporting, status tracking, and direct notifications to residents. This system is part of our commitment to safety and modern citizen services.', 'News', 1)
ON DUPLICATE KEY UPDATE `title`=`title`;
