-- CIPSE XV: asistencia por día del congreso + estado del envío del QR por correo
-- (MySQL 8). docker-entrypoint-initdb.d la ejecuta al crear el volumen.

CREATE TABLE attendance_records (
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
INSERT INTO attendance_records (accreditation_id, attended_on, attended_at, checked_in_by)
  SELECT id,
         DATE(checked_in_at),
         checked_in_at,
         COALESCE(checked_in_by, 'Acreditación CIPSE')
  FROM accreditations
  WHERE checked_in_at IS NOT NULL;

ALTER TABLE accreditations ADD COLUMN access_email_sent_at DATETIME NULL;

CREATE INDEX ix_attendance_day ON attendance_records (attended_on);

CREATE INDEX ix_accreditations_access_email_sent_at
  ON accreditations (access_email_sent_at);
