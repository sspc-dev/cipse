import type { ResultSetHeader } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import { generateAccessCode } from "./access-code";
import type { RegisterAccreditationDto } from "./dto";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Este correo electrónico ya tiene una solicitud registrada.");
    this.name = "DuplicateEmailError";
  }
}

/** Distingue la asistencia otorgada al registrarse de un escaneo del personal. */
const SELF_CHECKIN_LABEL = "Autorregistro";

function isDuplicateKeyError(error: unknown): boolean {
  const errno = (error as { errno?: number } | null)?.errno;
  const code = (error as { code?: string } | null)?.code;

  return errno === 1062 || code === "ER_DUP_ENTRY";
}

export async function insertAccreditation(
  dto: RegisterAccreditationDto,
): Promise<{ id: number; accessCode: string }> {
  const accessCode = generateAccessCode();

  try {
    return await withConnection(async (connection) => {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO accreditations (name, lastname, country, email, access_code)
         VALUES (?, ?, ?, ?, ?)`,
        [dto.name, dto.lastname, dto.country, dto.email, accessCode],
      );

      const id = result.insertId;

      if (typeof id !== "number" || id <= 0) {
        throw new Error("MySQL no devolvió un id válido para la inserción.");
      }

      // El registro web otorga la asistencia del día en el mismo alta.
      await connection.query(
        `INSERT INTO attendance_records
           (accreditation_id, attended_on, attended_at, checked_in_by)
         VALUES (?, CURDATE(), CURRENT_TIMESTAMP, ?)`,
        [id, SELF_CHECKIN_LABEL],
      );

      return { id, accessCode };
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}
