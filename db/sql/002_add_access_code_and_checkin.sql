-- CIPSE XV: código de acceso único para credencial QR y registro de asistencia
-- (MySQL 8). Para volúmenes ya inicializados, ejecutar manualmente.

ALTER TABLE accreditations
  ADD COLUMN access_code VARCHAR(32) NOT NULL;

-- Código aleatorio (32 hex) para filas existentes.
UPDATE accreditations
SET access_code = REPLACE(UPPER(UUID()), '-', '');

ALTER TABLE accreditations
  ADD UNIQUE INDEX uq_accreditations_access_code (access_code);

ALTER TABLE accreditations
  ADD COLUMN checked_in_at TIMESTAMP NULL,
  ADD COLUMN checked_in_by VARCHAR(120) NULL;

CREATE INDEX ix_accreditations_checked_in_at
  ON accreditations (checked_in_at);
