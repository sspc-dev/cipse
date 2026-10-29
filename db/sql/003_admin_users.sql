-- CIPSE XV: usuarios acreditadores y sesiones (MySQL 8).
-- Ejecutar manualmente en bases ya inicializadas; docker-entrypoint-initdb.d
-- lo corre al crear el volumen.

CREATE TABLE admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1) DEFAULT 1 NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_admin_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE admin_sessions (
  token_hash    CHAR(64) PRIMARY KEY,
  admin_user_id INT UNSIGNED NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_admin_sessions_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE,
  CONSTRAINT ck_admin_sessions_expiry CHECK (expires_at > '1970-01-03 00:00:01'),
  INDEX ix_admin_sessions_expires_at (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
