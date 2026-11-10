-- CarbonTrack Pro schema (MySQL 8 / MariaDB 10.5+, InnoDB, utf8mb4)
CREATE DATABASE IF NOT EXISTS carbontrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carbontrack;

CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(254) NOT NULL,
  display_name  VARCHAR(80)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,            -- password_hash(): never store plain text
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE assessments (                         -- one row per submitted calculator run (inputs)
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  waste_kg_day      DECIMAL(5,1) NOT NULL CHECK (waste_kg_day BETWEEN 0 AND 10),
  vehicle_km_day    DECIMAL(6,1) NOT NULL CHECK (vehicle_km_day BETWEEN 0 AND 120),
  electricity_units_month DECIMAL(6,1) NOT NULL CHECK (electricity_units_month BETWEEN 0 AND 600),
  lpg_cylinders_month     DECIMAL(4,1) NOT NULL CHECK (lpg_cylinders_month BETWEEN 0 AND 4),
  meat_meals_week   TINYINT UNSIGNED NOT NULL CHECK (meat_meals_week <= 21),
  transit_km_week   DECIMAL(6,1) NOT NULL CHECK (transit_km_week BETWEEN 0 AND 700),
  flight_hours_year DECIMAL(5,1) NOT NULL DEFAULT 0 CHECK (flight_hours_year BETWEEN 0 AND 200),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assess_user_date (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE results (                             -- computed output, 1:1 with an assessment
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id BIGINT UNSIGNED NOT NULL,
  daily_kg      DECIMAL(8,2) NOT NULL CHECK (daily_kg >= 0),
  yearly_tons   DECIMAL(8,3) NOT NULL CHECK (yearly_tons >= 0),
  top_source    VARCHAR(30)  NOT NULL,
  badge         ENUM('Climate Hero','Eco Champion','Eco Friendly','Needs Improvement') NOT NULL,
  trees_needed  INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_results_assessment (assessment_id),
  CONSTRAINT fk_results_assess FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  INDEX idx_results_badge (badge)
) ENGINE=InnoDB;

CREATE TABLE recommendations (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  result_id     BIGINT UNSIGNED NOT NULL,
  category      VARCHAR(30) NOT NULL,
  priority      ENUM('high','medium','low') NOT NULL,
  title         VARCHAR(120) NOT NULL,
  body          VARCHAR(500) NOT NULL,
  saving_kg_day DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rec_result FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  INDEX idx_rec_result_priority (result_id, priority)
) ENGINE=InnoDB;
