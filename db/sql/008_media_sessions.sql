-- CIPSE XV: sesiones de participantes acreditados para la galería multimedia.
-- El acceso se obtiene con correo electrónico + código de la credencial QR.
-- docker-entrypoint-initdb.d la ejecuta al crear el volumen.
--
-- Idempotente: converge en volúmenes nuevos y ya inicializados
-- (ver deploy/db-migrate.sh).

CREATE TABLE IF NOT EXISTS media_sessions (
  token_hash       CHAR(64) PRIMARY KEY,
  accreditation_id INT UNSIGNED NOT NULL,
  expires_at       TIMESTAMP NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT fk_media_sessions_accreditation
    FOREIGN KEY (accreditation_id) REFERENCES accreditations (id)
    ON DELETE CASCADE,
  CONSTRAINT ck_media_sessions_expiry CHECK (expires_at > '1970-01-03 00:00:01'),
  INDEX ix_media_sessions_expires_at (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
