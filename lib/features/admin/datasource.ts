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
  accessCode: string;
  createdAt: Date;
  attendanceDays: number;
  attendedToday: boolean;
  lastAttendanceAt: Date | null;
  /** Días del congreso con asistencia registrada (YYYY-MM-DD, ascendente). */
  attendanceDates: string[];
};

type AccreditationListRowPacket = RowDataPacket & {
  id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  access_code: string;
  created_at: Date;
  attendance_days: number;
  attended_today: number;
  last_attendance_at: Date | null;
  attendance_dates: string | null;
};

function mapRow(row: AccreditationListRowPacket): AccreditationListRow {
  return {
    id: Number(row.id),
    name: row.name,
    lastname: row.lastname,
    country: row.country,
    email: row.email,
    accessCode: row.access_code,
    createdAt: row.created_at,
    attendanceDays: Number(row.attendance_days ?? 0),
    attendedToday: Number(row.attended_today ?? 0) > 0,
    lastAttendanceAt: row.last_attendance_at,
    attendanceDates: row.attendance_dates
      ? row.attendance_dates.split(",").filter(Boolean)
      : [],
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
    return { condition: "a.id = ?", params: [String(folioId)] };
  }

  return {
    condition: "a.name LIKE ? OR a.lastname LIKE ? OR a.email LIKE ?",
    params: [pattern, pattern, pattern],
  };
}

export function buildCountryFilter(country: string): {
  condition: string;
  params: string[];
} {
  return { condition: "a.country = ?", params: [country] };
}

/**
 * Filtros de asistencia sobre `attendance_records`, único estado vivo del
 * delegado una vez eliminado el campo status.
 */
export type AttendanceFilterKind = "today" | "never";

export function buildAttendanceFilter(kind: AttendanceFilterKind): {
  condition: string;
  params: string[];
} {
  if (kind === "today") {
    return {
      condition: `EXISTS (
        SELECT 1 FROM attendance_records t
        WHERE t.accreditation_id = a.id
          AND t.attended_on = CURDATE()
      )`,
      params: [],
    };
  }

  return {
    condition: `NOT EXISTS (
      SELECT 1 FROM attendance_records t
      WHERE t.accreditation_id = a.id
    )`,
    params: [],
  };
}

function combineFilters(
  parts: ({ condition: string; params: string[] } | null)[],
): {
  whereClause: string;
  whereParams: string[];
} {
  const active = parts.filter(
    (part): part is { condition: string; params: string[] } => part !== null,
  );

  return {
    whereClause:
      active.length > 0
        ? `WHERE ${active.map((part) => part.condition).join(" AND ")}`
        : "",
    whereParams: active.flatMap((part) => part.params),
  };
}

export async function listAccreditations(
  query: AdminListQuery,
): Promise<{ rows: AccreditationListRow[]; total: number }> {
  const offset = (query.page - 1) * query.pageSize;
  const search = query.search;
  const country = query.country;
  const attendance = query.attendance;
  const combined = combineFilters([
    search ? buildSearchFilter(search) : null,
    country ? buildCountryFilter(country) : null,
    attendance ? buildAttendanceFilter(attendance) : null,
  ]);

  const result = await withConnection(async (connection) => {
    const [rows] = await connection.query<AccreditationListRowPacket[]>(
      `SELECT a.id, a.name, a.lastname, a.country, a.email, a.access_code,
              a.created_at,
              COUNT(r.id) AS attendance_days,
              EXISTS (
                SELECT 1 FROM attendance_records t
                WHERE t.accreditation_id = a.id AND t.attended_on = CURDATE()
              ) AS attended_today,
              MAX(r.attended_at) AS last_attendance_at,
              GROUP_CONCAT(DISTINCT DATE_FORMAT(r.attended_on, '%Y-%m-%d')
                           ORDER BY r.attended_on) AS attendance_dates
       FROM accreditations a
       LEFT JOIN attendance_records r ON r.accreditation_id = a.id
       ${combined.whereClause}
       GROUP BY a.id, a.name, a.lastname, a.country, a.email,
                a.access_code, a.created_at
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...combined.whereParams, query.pageSize, offset],
    );

    const [countRows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM accreditations a ${combined.whereClause}`,
      combined.whereParams,
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
        access_code: string;
      })[]
    >(
      `SELECT id, name, lastname, email, access_code
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
    accessCode: record.access_code,
  };
}

export type AccreditationStats = {
  total: number;
  checkedInToday: number;
  /** Altas de los últimos 7 días calendario. */
  newLast7Days: number;
  /** Acreditados que nunca han registrado asistencia. */
  withoutAttendance: number;
};

export async function getStats(): Promise<AccreditationStats> {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*)
          FROM accreditations)                         AS total,
         (SELECT COUNT(*)
          FROM attendance_records
          WHERE attended_on = CURDATE())               AS checkedInToday,
         (SELECT COUNT(*)
          FROM accreditations n
          WHERE n.created_at >= CURDATE() - INTERVAL 7 DAY)  AS newLast7Days,
         (SELECT COUNT(*)
          FROM accreditations n
          WHERE NOT EXISTS (
            SELECT 1 FROM attendance_records t
            WHERE t.accreditation_id = n.id
          ))                                           AS withoutAttendance`,
    );

    const row = rows[0] as Record<string, string | number | null> | undefined;

    if (!row) {
      return {
        total: 0,
        checkedInToday: 0,
        newLast7Days: 0,
        withoutAttendance: 0,
      };
    }

    return {
      total: Number(row["total"] ?? 0),
      checkedInToday: Number(row["checkedInToday"] ?? 0),
      newLast7Days: Number(row["newLast7Days"] ?? 0),
      withoutAttendance: Number(row["withoutAttendance"] ?? 0),
    };
  });
}

export type RegistrationsByCountry = {
  /** Valor almacenado: código ISO alpha-2 o nombre legacy. */
  country: string;
  total: number;
  attended: number;
};

/**
 * Distribución de acreditaciones por país: los valores se agrupan por la
 * columna tal cual está almacenada, de modo que la consulta no distingue
 * entre códigos ISO y nombres legacy. `attended` cuenta países con al menos
 * un día de asistencia registrado.
 */
export async function getRegistrationsByCountry(
  limit = 6,
): Promise<RegistrationsByCountry[]> {
  const rows = await withConnection(async (connection) => {
    const [result] = await connection.query<RowDataPacket[]>(
      `SELECT country,
              COUNT(*) AS total,
              SUM(EXISTS (
                SELECT 1 FROM attendance_records t
                WHERE t.accreditation_id = accreditations.id
              )) AS attended
       FROM accreditations
       GROUP BY country
       ORDER BY total DESC, country ASC
       LIMIT ?`,
      [limit],
    );

    return result as { country: string; total: number; attended: number }[];
  });

  return rows.map((row) => ({
    country: row.country,
    total: Number(row["total"] ?? 0),
    attended: Number(row["attended"] ?? 0),
  }));
}

export type AttendanceByDay = {
  /** Fecha en formato YYYY-MM-DD (día del congreso). */
  day: string;
  count: number;
};

export type RegistrationsByDay = {
  /** Fecha en formato YYYY-MM-DD (día del congreso). */
  day: string;
  count: number;
};

/**
 * Altas por día para la tendencia de registro: últimos `windowDays` días
 * calendario, con los días sin altas rellenados a cero. Solo lectura.
 */
export async function getRegistrationsByDay(
  windowDays = 30,
): Promise<RegistrationsByDay[]> {
  const rows = await withConnection(async (connection) => {
    const [result] = await connection.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS altas
       FROM accreditations
       WHERE created_at >= CURDATE() - INTERVAL ? DAY
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY DATE_FORMAT(created_at, '%Y-%m-%d')`,
      [windowDays - 1],
    );

    return result as { day: string; altas: number }[];
  });

  const countsByDay = new Map(
    rows.map((row) => [row.day, Number(row.altas)]),
  );

  /* La ventana se ancla al día del congreso (CDMX), no al huso del servidor:
   * se recorre aritmética sobre mediodías UTC para evitar saltos de fecha. */
  const todayIso = isoDayInCongressTime(new Date());
  const [year, month, day] = todayIso.split("-").map(Number);
  const anchorUtcNoon = Date.UTC(year, month - 1, day, 12);

  const days: RegistrationsByDay[] = [];
  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const iso = new Date(anchorUtcNoon - offset * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    days.push({ day: iso, count: countsByDay.get(iso) ?? 0 });
  }

  return days.slice(-windowDays);
}

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
