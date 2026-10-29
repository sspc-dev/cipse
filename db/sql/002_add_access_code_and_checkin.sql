-- CIPSE XV: código de acceso único para credencial QR y registro de asistencia
-- Ejecutar como usuario de la aplicación con permisos ALTER TABLE.

ALTER TABLE accreditations ADD access_code VARCHAR2(32);

ALTER TABLE accreditations ADD checked_in_at TIMESTAMP;

ALTER TABLE accreditations ADD checked_in_by VARCHAR2(120);

-- Código aleatorio (32 hex) para filas existentes; NULL para reintentos.
UPDATE accreditations
SET access_code = RAWTOHEX(SYS_GUID())
WHERE access_code IS NULL;

ALTER TABLE accreditations MODIFY access_code VARCHAR2(32) NOT NULL;

CREATE UNIQUE INDEX uq_accreditations_access_code
  ON accreditations (access_code);

CREATE INDEX ix_accreditations_checked_in_at
  ON accreditations (checked_in_at);
