import type { RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import type { AttendanceReportRow } from "./attendance-report";

type AttendanceReportRowPacket = RowDataPacket & {
  accreditation_id: number;
  name: string;
  lastname: string;
  country: string;
  email: string;
  phone: string | null;
  attended_on: string;
};

/**
 * Asistencias registradas con los datos del delegado, ordenadas por día y
 * nombre. Solo lectura: una fila por cada asistencia (delegado × día).
 * Con `day` (YYYY-MM-DD) se limita al día indicado.
 */
export async function listAttendanceReportRows(
  day?: string,
): Promise<AttendanceReportRow[]> {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query<AttendanceReportRowPacket[]>(
      `SELECT r.accreditation_id, a.name, a.lastname, a.country, a.email,
              a.phone,
              DATE_FORMAT(r.attended_on, '%Y-%m-%d') AS attended_on
       FROM attendance_records r
       INNER JOIN accreditations a ON a.id = r.accreditation_id
       ${day ? "WHERE r.attended_on = ?" : ""}
       ORDER BY r.attended_on, a.lastname, a.name`,
      day ? [day] : [],
    );

    return rows.map((row) => ({
      accreditationId: Number(row.accreditation_id),
      name: row.name,
      lastname: row.lastname,
      country: row.country,
      email: row.email,
      phone: row.phone ?? "",
      attendedOn: row.attended_on,
    }));
  });
}
