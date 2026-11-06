-- CIPSE XV: asistencia por día del congreso + estado del envío del QR por correo
-- (MySQL 8).
-- docker-entrypoint-initdb.d la ejecuta al crear el volumen.
--
-- Idempotente: la tabla se crea solo si falta, el respaldo usa INSERT IGNORE
-- (la clave única evita duplicados) y la columna/índices se agregan solo si
-- no existen. Converge en volúmenes nuevos y ya inicializados
-- (ver deploy/db-migrate.sh).

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  accreditation_id INT UNSIGNED NOT NULL,
  attended_on DATE NOT NULL,
  attended_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_by VARCHAR(120) NOT NULL,
  CONSTRAINT uq_attendance_day UNIQUE (accreditation_id, attended_on),
  CONSTRAINT fk_attendance_accreditation
    FOREIGN KEY (accreditation_id) REFERENCES accreditations (id)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Respaldo del historial existente: cada checked_in_at se convierte en su día.
-- INSERT IGNORE: no duplica filas ya migradas (uq_attendance_day).
INSERT IGNORE INTO attendance_records (accreditation_id, attended_on, attended_at, checked_in_by)
  SELECT id,
         DATE(checked_in_at),
         checked_in_at,
         COALESCE(checked_in_by, 'Acreditación CIPSE')
  FROM accreditations
  WHERE checked_in_at IS NOT NULL;

SET @has_access_email_sent_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND COLUMN_NAME = 'access_email_sent_at'
);

SET @add_access_email_sent_at := IF(
  @has_access_email_sent_at = 0,
  'ALTER TABLE accreditations ADD COLUMN access_email_sent_at DATETIME NULL',
  'SELECT 1 AS access_email_sent_at_ya_existe'
);

PREPARE add_access_email_sent_at_stmt FROM @add_access_email_sent_at;
EXECUTE add_access_email_sent_at_stmt;
DEALLOCATE PREPARE add_access_email_sent_at_stmt;

SET @has_attendance_day_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attendance_records'
    AND INDEX_NAME = 'ix_attendance_day'
);

SET @add_attendance_day_index := IF(
  @has_attendance_day_index = 0,
  'CREATE INDEX ix_attendance_day ON attendance_records (attended_on)',
  'SELECT 1 AS indice_attendance_day_ya_existe'
);

PREPARE add_attendance_day_index_stmt FROM @add_attendance_day_index;
EXECUTE add_attendance_day_index_stmt;
DEALLOCATE PREPARE add_attendance_day_index_stmt;

SET @has_access_email_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accreditations'
    AND INDEX_NAME = 'ix_accreditations_access_email_sent_at'
);

SET @add_access_email_index := IF(
  @has_access_email_index = 0,
  'CREATE INDEX ix_accreditations_access_email_sent_at ON accreditations (access_email_sent_at)',
  'SELECT 1 AS indice_access_email_ya_existe'
);

PREPARE add_access_email_index_stmt FROM @add_access_email_index;
EXECUTE add_access_email_index_stmt;
DEALLOCATE PREPARE add_access_email_index_stmt;
