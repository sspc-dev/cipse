-- CIPSE XV: elimina el campo status de la acreditación.
-- El estado vivo del delegado vive en attendance_records; los filtros del
-- panel pasan a basarse en asistencia (hoy / sin asistencia).
--
-- Idempotente: los volúmenes nuevos ya crean la tabla sin status (001
-- actualizado), así que el DROP solo corre si la columna aún existe.
-- Ejecutar manualmente en volúmenes inicializados antes de esta versión.

SET @has_status := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'status'
);

SET @drop_status := IF(
  @has_status = 1,
  'ALTER TABLE accreditations DROP COLUMN status',
  'SELECT 1 AS status_ya_eliminado'
);

PREPARE drop_stmt FROM @drop_status;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;
