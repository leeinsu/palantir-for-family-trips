-- MariaDB schema for Trip-centered tour app
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS and additive indexes/constraints where possible.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trips (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  description TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trips_owner (owner_user_id, created_at),
  CONSTRAINT fk_trips_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_members (
  trip_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'member',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (trip_id, user_id),
  INDEX idx_trip_members_user (user_id, trip_id),
  CONSTRAINT fk_trip_members_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visited_places (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trip_id BIGINT NOT NULL,
  place_type VARCHAR(30) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  external_provider VARCHAR(50) NULL,
  external_place_id VARCHAR(255) NULL,
  memo TEXT NULL,
  visited_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_places_trip_type (trip_id, place_type),
  INDEX idx_places_trip_time (trip_id, visited_at),
  CONSTRAINT fk_places_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trip_id BIGINT NOT NULL,
  place_id BIGINT NULL,
  title VARCHAR(255) NOT NULL,
  meal_type VARCHAR(30) NOT NULL,
  scheduled_at DATETIME NULL,
  reservation_status VARCHAR(30) NOT NULL DEFAULT 'none',
  memo TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_meals_trip_time (trip_id, scheduled_at),
  CONSTRAINT fk_meals_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_meals_place FOREIGN KEY (place_id) REFERENCES visited_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shopping_lists (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trip_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  place_id BIGINT NULL,
  created_by BIGINT NOT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopping_lists_trip (trip_id, created_at),
  CONSTRAINT fk_shopping_lists_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_shopping_lists_place FOREIGN KEY (place_id) REFERENCES visited_places(id) ON DELETE SET NULL,
  CONSTRAINT fk_shopping_lists_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shopping_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  shopping_list_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100) NULL,
  assigned_user_id BIGINT NULL,
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at DATETIME NULL,
  memo TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shopping_items_list (shopping_list_id, sort_order),
  CONSTRAINT fk_shopping_items_list FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_shopping_items_assignee FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movement_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trip_id BIGINT NOT NULL,
  log_type VARCHAR(30) NOT NULL,
  from_place_id BIGINT NULL,
  to_place_id BIGINT NULL,
  title VARCHAR(255) NOT NULL,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  distance_meters INT NULL,
  duration_seconds INT NULL,
  route_provider VARCHAR(50) NULL,
  route_geometry JSON NULL,
  memo TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_movement_trip_time (trip_id, started_at),
  CONSTRAINT fk_movement_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_movement_from_place FOREIGN KEY (from_place_id) REFERENCES visited_places(id) ON DELETE SET NULL,
  CONSTRAINT fk_movement_to_place FOREIGN KEY (to_place_id) REFERENCES visited_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  trip_id BIGINT NOT NULL,
  place_id BIGINT NULL,
  meal_id BIGINT NULL,
  movement_log_id BIGINT NULL,
  uploaded_by BIGINT NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  thumbnail_object_key VARCHAR(500) NULL,
  original_filename VARCHAR(255) NULL,
  content_type VARCHAR(100) NOT NULL,
  taken_at DATETIME NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  memo TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photos_trip_created (trip_id, created_at),
  INDEX idx_photos_place (place_id, created_at),
  CONSTRAINT fk_photos_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_photos_place FOREIGN KEY (place_id) REFERENCES visited_places(id) ON DELETE SET NULL,
  CONSTRAINT fk_photos_meal FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL,
  CONSTRAINT fk_photos_movement FOREIGN KEY (movement_log_id) REFERENCES movement_logs(id) ON DELETE SET NULL,
  CONSTRAINT fk_photos_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS map_cache (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  request_hash VARCHAR(128) NOT NULL,
  response_json JSON NOT NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_map_cache_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_trip_core_schema');
