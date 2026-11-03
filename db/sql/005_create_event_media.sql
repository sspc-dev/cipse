-- CIPSE XV: material multimedia del evento (imágenes, videos y documentos).
-- Los archivos viven en OCI Object Storage; aquí solo se guardan metadatos.
-- docker-entrypoint-initdb.d la ejecuta al crear el volumen.

CREATE TABLE event_media (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  day           TINYINT UNSIGNED NOT NULL,
  kind          ENUM('image', 'video', 'document') NOT NULL,
  title         VARCHAR(160) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime          VARCHAR(127) NOT NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL,
  object_key    VARCHAR(320) NOT NULL,
  created_by    INT UNSIGNED NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_event_media_object_key UNIQUE (object_key),
  CONSTRAINT fk_event_media_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users (id)
    ON DELETE SET NULL,
  INDEX ix_event_media_day (day)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
