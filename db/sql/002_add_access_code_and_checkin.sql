-- CIPSE XV: código de acceso único para credencial QR y registro de asistencia
-- (MySQL 8).
--
-- Idempotente: cada columna e índice se agrega solo si aún no existe, y el
-- código aleatorio se asigna solo a filas vacías. Converge en volúmenes
-- nuevos y ya inicializados (ver deploy/db-migrate.sh).

SET @has_access_code := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'access_code'
);

SET @add_access_code := IF(
  @has_access_code = 0,
  'ALTER TABLE accreditations ADD COLUMN access_code VARCHAR(32) NOT NULL',
  'SELECT 1 AS access_code_ya_existe'
);

PREPARE add_access_code_stmt FROM @add_access_code;
EXECUTE add_access_code_stmt;
DEALLOCATE PREPARE add_access_code_stmt;

-- Código aleatorio (32 hex) para filas sin código asignado.
UPDATE accreditations
SET access_code = REPLACE(UPPER(UUID()), '-', '')
WHERE access_code = '';

SET @has_access_code_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND INDEX_NAME = 'uq_accreditations_access_code'
);

SET @add_access_code_index := IF(
  @has_access_code_index = 0,
  'ALTER TABLE accreditations ADD UNIQUE INDEX uq_accreditations_access_code (access_code)',
  'SELECT 1 AS indice_access_code_ya_existe'
);

PREPARE add_access_code_index_stmt FROM @add_access_code_index;
EXECUTE add_access_code_index_stmt;
DEALLOCATE PREPARE add_access_code_index_stmt;

SET @has_checked_in_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'checked_in_at'
);

SET @add_checked_in_at := IF(
  @has_checked_in_at = 0,
  'ALTER TABLE accreditations ADD COLUMN checked_in_at TIMESTAMP NULL',
  'SELECT 1 AS checked_in_at_ya_existe'
);

PREPARE add_checked_in_at_stmt FROM @add_checked_in_at;
EXECUTE add_checked_in_at_stmt;
DEALLOCATE PREPARE add_checked_in_at_stmt;

SET @has_checked_in_by := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'checked_in_by'
);

SET @add_checked_in_by := IF(
  @has_checked_in_by = 0,
  'ALTER TABLE accreditations ADD COLUMN checked_in_by VARCHAR(120) NULL',
  'SELECT 1 AS checked_in_by_ya_existe'
);

PREPARE add_checked_in_by_stmt FROM @add_checked_in_by;
EXECUTE add_checked_in_by_stmt;
DEALLOCATE PREPARE add_checked_in_by_stmt;

SET @has_checked_in_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND INDEX_NAME = 'ix_accreditations_checked_in_at'
);

SET @add_checked_in_index := IF(
  @has_checked_in_index = 0,
  'CREATE INDEX ix_accreditations_checked_in_at ON accreditations (checked_in_at)',
  'SELECT 1 AS indice_checked_in_ya_existe'
);

PREPARE add_checked_in_index_stmt FROM @add_checked_in_index;
EXECUTE add_checked_in_index_stmt;
DEALLOCATE PREPARE add_checked_in_index_stmt;
