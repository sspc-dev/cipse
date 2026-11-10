/**
 * Prueba de integración opcional del registro de asistencias contra MySQL.
 *
 * Verifica en la BD real (dev) las garantías de la corrección de zona
 * horaria:
 *  - `attended_on` se almacena con el parámetro del día de negocio (CDMX)
 *    que calcula la aplicación, no con CURDATE() de la sesión.
 *  - `attended_at` recibe un instante JS y mysql2 lo serializa como UTC
 *    (pool con `timezone: "Z"`, igual que en producción), con pérdida solo
 *    de milisegundos (DATETIME tiene precisión de segundo).
 *
 * Se omite automáticamente (skip) cuando:
 *  - no están definidas MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE, o
 *  - el servidor MySQL no es accesible (p. ej. `pnpm db:up` no está corriendo).
 *
 * Crea una acreditación de prueba con email/código aleatorios y la elimina
 * al finalizar; no toca registros históricos.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import {
  createPool,
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

import { congressTodayIso } from "../lib/congress-dates.ts";

const configured = Boolean(
  process.env.MYSQL_USER &&
    process.env.MYSQL_PASSWORD &&
    process.env.MYSQL_DATABASE,
);

/** Pool con las mismas opciones que lib/db/mysql-client.ts (`timezone: "Z"`). */
async function connect(): Promise<Pool | null> {
  const pool = createPool({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? "3306"),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 1,
    waitForConnections: false,
    timezone: "Z",
  });
  try {
    await pool.query("SELECT 1");
    return pool;
  } catch {
    await pool.end().catch(() => undefined);
    return null;
  }
}

type AttendanceRow = RowDataPacket & { day: string; at: Date };

test(
  "attendance_records: attended_on (día CDMX) y attended_at (UTC) round-trip",
  { skip: configured ? false : "MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE no definidos" },
  async (t) => {
    const pool = await connect();
    if (!pool) {
      t.skip("MySQL no accesible (¿pnpm db:up?)");
      return;
    }

    const unique = randomBytes(12).toString("hex");
    let accreditationId = 0;

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO accreditations (name, lastname, country, email, access_code)
         VALUES (?, ?, ?, ?, ?)`,
        ["Prueba", "Zona Horaria", "MX", `tz-${unique}@example.test`, unique],
      );
      accreditationId = Number(result.insertId);
      assert.ok(accreditationId > 0);

      // --- Escenario A: instante real de la incidencia -------------------
      // 2026-11-10T00:44:31Z == 2026-11-09 18:44:31 CDMX → el día de
      // negocio debe ser 2026-11-09 aunque el instante caiga en el 10 UTC.
      const incidentInstant = new Date("2026-11-10T00:44:31.000Z");
      await pool.query(
        `INSERT INTO attendance_records
           (accreditation_id, attended_on, attended_at, checked_in_by)
         VALUES (?, ?, ?, ?)`,
        [accreditationId, "2026-11-09", incidentInstant, "Prueba TZ"],
      );

      const [rows] = await pool.query<AttendanceRow[]>(
        `SELECT DATE_FORMAT(attended_on, '%Y-%m-%d') AS day, attended_at AS at
         FROM attendance_records
         WHERE accreditation_id = ? AND attended_on = ?`,
        [accreditationId, "2026-11-09"],
      );
      assert.equal(rows.length, 1, "el filtro por día de negocio lo encuentra");
      assert.equal(rows[0].day, "2026-11-09");
      assert.equal(rows[0].at.toISOString(), incidentInstant.toISOString());

      // --- Escenario B: insert con el día/instante que calcula la app -----
      await pool.query(
        `DELETE FROM attendance_records WHERE accreditation_id = ?`,
        [accreditationId],
      );

      const dayBefore = congressTodayIso();
      const insertedAt = new Date();
      await pool.query(
        `INSERT INTO attendance_records
           (accreditation_id, attended_on, attended_at, checked_in_by)
         VALUES (?, ?, ?, ?)`,
        [accreditationId, dayBefore, insertedAt, "Autorregistro"],
      );

      const [todayRows] = await pool.query<AttendanceRow[]>(
        `SELECT DATE_FORMAT(attended_on, '%Y-%m-%d') AS day, attended_at AS at
         FROM attendance_records
         WHERE accreditation_id = ?`,
        [accreditationId],
      );
      assert.equal(todayRows.length, 1);
      assert.equal(todayRows[0].day, dayBefore);
      // mysql2 redondea los milisegundos al serializar Date → DATETIME
      // (precisión de segundo): el instante debe conservarse con desfase < 1 s.
      const driftMs = Math.abs(
        todayRows[0].at.getTime() - insertedAt.getTime(),
      );
      assert.ok(
        driftMs < 1000,
        `attended_at debe conservar el instante UTC (desfase ${driftMs} ms)`,
      );
    } finally {
      if (accreditationId > 0) {
        await pool
          .query(`DELETE FROM attendance_records WHERE accreditation_id = ?`, [
            accreditationId,
          ])
          .catch(() => undefined);
        await pool
          .query(`DELETE FROM accreditations WHERE id = ?`, [accreditationId])
          .catch(() => undefined);
      }
      await pool.end().catch(() => undefined);
    }
  },
);
