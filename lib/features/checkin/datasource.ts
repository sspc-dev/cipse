import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";

export type AccreditationRecord = {
  id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  status: string;
  checkedInAt: Date | null;
  checkedInBy: string | null;
};

type AccreditationRow = RowDataPacket & {
  id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  status: string;
  checked_in_at: Date | null;
  checked_in_by: string | null;
};

type AttendanceRow = RowDataPacket & {
  attended_at: Date;
};

function mapRow(row: AccreditationRow): AccreditationRecord {
  return {
    id: Number(row.id),
    name: row.name,
    lastname: row.lastname,
    country: row.country,
    email: row.email,
    status: row.status,
    checkedInAt: row.checked_in_at,
    checkedInBy: row.checked_in_by,
  };
}

export async function findAccreditationByCode(
  accessCode: string,
): Promise<AccreditationRecord | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<AccreditationRow[]>(
      `SELECT id, name, lastname, country, email, status,
              checked_in_at, checked_in_by
       FROM accreditations
       WHERE access_code = ?`,
      [accessCode],
    );

    return rows[0] ?? null;
  });

  return record ? mapRow(record) : null;
}

export type AttendanceDayResult = {
  record: AccreditationRecord;
  attendedAt: Date;
  created: boolean;
  attendanceDays: number;
};

/**
 * Primera lectura del día: si ya existe asistencia para la fecha actual
 * devuelve esa sin duplicar; si es otro día del congreso, registra la
 * asistencia de hoy. La clave única uq_attendance_day protege contra
 * lecturas concurrentes.
 */
export async function registerAttendanceByDay(
  accessCode: string,
  checkedInBy: string,
): Promise<AttendanceDayResult | null> {
  return await withConnection(async (connection) => {
    const [baseRows] = await connection.query<AccreditationRow[]>(
      `SELECT id, name, lastname, country, email, status,
              checked_in_at, checked_in_by
       FROM accreditations
       WHERE access_code = ?`,
      [accessCode],
    );
    const baseRow = baseRows[0];
    if (!baseRow) return null;

    const [todayRows] = await connection.query<AttendanceRow[]>(
      `SELECT attended_at
       FROM attendance_records
       WHERE accreditation_id = ? AND attended_on = CURDATE()`,
      [baseRow.id],
    );
    const today = todayRows[0];

    if (today) {
      return {
        record: mapRow(baseRow),
        attendedAt: new Date(today.attended_at),
        created: false,
        attendanceDays: await countAttendanceDays(connection, baseRow.id),
      };
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO attendance_records (accreditation_id, attended_on, attended_at, checked_in_by)
       VALUES (?, CURDATE(), CURRENT_TIMESTAMP, ?)`,
      [baseRow.id, checkedInBy],
    );

    // Si otra lectura concurrente insertó primero, seguimos su hora real.
    const [freshRows] = await connection.query<AttendanceRow[]>(
      `SELECT attended_at
       FROM attendance_records
       WHERE accreditation_id = ? AND attended_on = CURDATE()`,
      [baseRow.id],
    );

    return {
      record: mapRow(baseRow),
      attendedAt: freshRows[0]
        ? new Date(freshRows[0].attended_at)
        : new Date(),
      created: insertResult.affectedRows > 0,
      attendanceDays: await countAttendanceDays(connection, baseRow.id),
    };
  });
}

async function countAttendanceDays(
  connection: PoolConnection,
  accreditationId: number,
): Promise<number> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT attended_on) AS total
     FROM attendance_records
     WHERE accreditation_id = ?`,
    [accreditationId],
  );

  return Number(rows[0]?.total ?? 0);
}

export async function attendanceDaysFor(
  accreditationId: number,
): Promise<number> {
  return await withConnection(async (connection) => {
    return await countAttendanceDays(connection, accreditationId);
  });
}

export async function findAttendanceToday(
  accreditationId: number,
): Promise<Date | null> {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query<AttendanceRow[]>(
      `SELECT attended_at
       FROM attendance_records
       WHERE accreditation_id = ? AND attended_on = CURDATE()`,
      [accreditationId],
    );

    return rows[0] ? new Date(rows[0].attended_at) : null;
  });
}
