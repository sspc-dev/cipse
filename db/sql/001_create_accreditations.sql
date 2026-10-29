-- CIPSE XV: tabla de solicitudes de acreditación (MySQL 8)
-- docker-entrypoint-initdb.d la ejecuta al crear el volumen, en orden alfabético.

CREATE TABLE accreditations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  lastname    VARCHAR(120) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  email       VARCHAR(254) NOT NULL,
  status      VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_accreditations_email UNIQUE (email),
  CONSTRAINT ck_accreditations_status
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX ix_accreditations_created_at ON accreditations (created_at);
