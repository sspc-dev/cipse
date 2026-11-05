-- CIPSE XV: datos institucionales del delegado (cargo, institución y teléfono).
--
-- Idempotente: cada columna se agrega solo si aún no existe, para que los
-- volúmenes nuevos (que ejecutan este archivo en orden) y los ya inicializados
-- converjan al mismo esquema.
-- Ejecutar manualmente en volúmenes inicializados antes de esta versión.

SET @has_institution := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'institution'
);

SET @add_institution := IF(
  @has_institution = 0,
  'ALTER TABLE accreditations ADD COLUMN institution VARCHAR(160) NOT NULL DEFAULT '''' AFTER country',
  'SELECT 1 AS institution_ya_existe'
);

PREPARE add_institution_stmt FROM @add_institution;
EXECUTE add_institution_stmt;
DEALLOCATE PREPARE add_institution_stmt;

SET @has_position := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'position'
);

SET @add_position := IF(
  @has_position = 0,
  'ALTER TABLE accreditations ADD COLUMN position VARCHAR(120) NOT NULL DEFAULT '''' AFTER institution',
  'SELECT 1 AS position_ya_existe'
);

PREPARE add_position_stmt FROM @add_position;
EXECUTE add_position_stmt;
DEALLOCATE PREPARE add_position_stmt;

SET @has_phone := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'phone'
);

SET @add_phone := IF(
  @has_phone = 0,
  'ALTER TABLE accreditations ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '''' AFTER position',
  'SELECT 1 AS phone_ya_existe'
);

PREPARE add_phone_stmt FROM @add_phone;
EXECUTE add_phone_stmt;
DEALLOCATE PREPARE add_phone_stmt;
