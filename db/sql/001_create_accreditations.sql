-- CIPSE XV: tabla de solicitudes de acreditación (MySQL 8)
-- docker-entrypoint-initdb.d la ejecuta al crear el volumen, en orden alfabético.
--
-- Idempotente: converge tanto en volúmenes nuevos como en volúmenes ya
-- inicializados que no recibieron esta versión (ver deploy/db-migrate.sh).

CREATE TABLE IF NOT EXISTS accreditations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  lastname    VARCHAR(120) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  email       VARCHAR(254) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_accreditations_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

SET @has_created_at_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND INDEX_NAME = 'ix_accreditations_created_at'
);

SET @add_created_at_index := IF(
  @has_created_at_index = 0,
  'CREATE INDEX ix_accreditations_created_at ON accreditations (created_at)',
  'SELECT 1 AS indice_ya_existe'
);

PREPARE add_created_at_index_stmt FROM @add_created_at_index;
EXECUTE add_created_at_index_stmt;
DEALLOCATE PREPARE add_created_at_index_stmt;
