import type { RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import { isoDayInCongressTime } from "./dates";
import type { AdminListQuery } from "./schemas";

export type AccreditationListRow = {
  id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  status: string;
  accessCode: string;
  createdAt: Date;
  attendanceDays: number;
  attendedToday: boolean;
  lastAttendanceAt: Date | null;
};

type AccreditationListRowPacket = RowDataPacket & {
  id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  status: string;
  access_code: string;
  created_at: Date;
  attendance_days: number;
  attended_today: number;
  last_attendance_at: Date | null;
};

function mapRow(row: AccreditationListRowPacket): AccreditationListRow {
  return {
    id: Number(row.id),
    name: row.name,
    lastname: row.lastname,
    country: row.country,
    email: row.email,
    status: row.status,
    accessCode: row.access_code,
    createdAt: row.created_at,
    attendanceDays: Number(row.attendance_days ?? 0),
    attendedToday: Number(row.attended_today ?? 0) > 0,
    lastAttendanceAt: row.last_attendance_at,
  };
}

function buildSearchFilter(search: string): {
  condition: string;
  params: string[];
} {
  const pattern = `%${search}%`;
  const isFolio = /^CIPSE-\d{1,4}$/i.test(search.trim());

  if (isFolio) {
    // Los folios son CIPSE-0001: coincide por id.
    const folioId = Number(search.trim().split("-")[1]);
    return { condition: "id = ?", params: [String(folioId)] };
  }

  return {
    condition: "name LIKE ? OR lastname LIKE ? OR email LIKE ?",
    params: [pattern, pattern, pattern],
  };
}

export async function listAccreditations(
  query: AdminListQuery,
): Promise<{ rows: AccreditationListRow[]; total: number }> {
  const offset = (query.page - 1) * query.pageSize;
  const search = query.search;
  const searchFilter = search ? buildSearchFilter(search) : null;

  const result = await withConnection(async (connection) => {
    const whereClause = searchFilter
      ? `WHERE ${searchFilter.condition}`
      : "";
    const whereParams = searchFilter ? searchFilter.params : [];
    const [rows] = await connection.query<AccreditationListRowPacket[]>(
      `SELECT a.id, a.name, a.lastname, a.country, a.email, a.status, a.access_code,
              a.created_at,
              COUNT(r.id) AS attendance_days,
              EXISTS (
                SELECT 1 FROM attendance_records t
                WHERE t.accreditation_id = a.id AND t.attended_on = CURDATE()
              ) AS attended_today,
              MAX(r.attended_at) AS last_attendance_at
       FROM accreditations a
       LEFT JOIN attendance_records r ON r.accreditation_id = a.id
       ${whereClause}
       GROUP BY a.id, a.name, a.lastname, a.country, a.email, a.status,
                a.access_code, a.created_at
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, query.pageSize, offset],
    );

    const [countRows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM accreditations ${
        searchFilter ? `WHERE ${searchFilter.condition}` : ""
      }`,
      whereParams,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { rows: rows.map(mapRow), total };
  });

  return result;
}

export type AccreditationCredentials = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  status: string;
  accessCode: string;
};

/**
 * Credencial de un delegado por id: datos mínimos para renderizar
 * y descargar su QR desde la vista de impresión del panel.
 */
export async function findAccreditationById(
  id: number,
): Promise<AccreditationCredentials | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<
      (RowDataPacket & {
        id: number;
        name: string;
        lastname: string;
        email: string;
        status: string;
        access_code: string;
      })[]
    >(
      `SELECT id, name, lastname, email, status, access_code
       FROM accreditations
       WHERE id = ?`,
      [id],
    );

    return rows[0] ?? null;
  });

  if (!record) return null;

  return {
    id: Number(record.id),
    name: record.name,
    lastname: record.lastname,
    email: record.email,
    status: record.status,
    accessCode: record.access_code,
  };
}

export type AccreditationStats = {
  total: number;
  approved: number;
  pending: number;
  checkedInToday: number;
};

export async function getStats(): Promise<AccreditationStats> {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT
         COUNT(*)                                    AS total,
         SUM(status = 'APPROVED')                    AS approved,
         SUM(status = 'PENDING')                     AS pending,
         (SELECT COUNT(*)
          FROM attendance_records
          WHERE attended_on = CURDATE())             AS checkedInToday
       FROM accreditations`,
    );

    const row = rows[0] as Record<string, string | number | null> | undefined;

    if (!row) {
      return { total: 0, approved: 0, pending: 0, checkedInToday: 0 };
    }

    return {
      total: Number(row["total"] ?? 0),
      approved: Number(row["approved"] ?? 0),
      pending: Number(row["pending"] ?? 0),
      checkedInToday: Number(row["checkedInToday"] ?? 0),
    };
  });
}

export type AttendanceByDay = {
  /** Fecha en formato YYYY-MM-DD (día del congreso). */
  day: string;
  count: number;
};

/**
 * Asistencias por día para la gráfica del panel: últimos `windowDays` días
 * calendario, con los días sin asistencia rellenados a cero.
 */
export async function getAttendanceByDay(
  windowDays = 7,
): Promise<AttendanceByDay[]> {
  const rows = await withConnection(async (connection) => {
    const [result] = await connection.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(attended_on, '%Y-%m-%d') AS day, COUNT(*) AS registrados
       FROM attendance_records
       WHERE attended_on >= CURDATE() - INTERVAL ? DAY
       GROUP BY attended_on
       ORDER BY attended_on`,
      [windowDays - 1],
    );

    return result as { day: string; registrados: number }[];
  });

  const countsByDay = new Map(
    rows.map((row) => [row.day, Number(row.registrados)]),
  );

  /* La ventana se ancla al día del congreso (CDMX), no al huso del servidor:
   * se recorre aritmética sobre mediodías UTC para evitar saltos de fecha. */
  const todayIso = isoDayInCongressTime(new Date());
  const [year, month, day] = todayIso.split("-").map(Number);
  const anchorUtcNoon = Date.UTC(year, month - 1, day, 12);

  const days: AttendanceByDay[] = [];
  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const iso = new Date(anchorUtcNoon - offset * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    days.push({ day: iso, count: countsByDay.get(iso) ?? 0 });
  }

  return days.slice(-windowDays);
}
