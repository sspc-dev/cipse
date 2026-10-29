import oracledb from "oracledb";
import { withConnection } from "@/lib/db/oracle-client";
import { generateAccessCode } from "./access-code";
import type { RegisterAccreditationDto } from "./dto";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Este correo electrónico ya tiene una solicitud registrada.");
    this.name = "DuplicateEmailError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { errorNum?: number } | null)?.errorNum === 1;
}

export async function insertAccreditation(
  dto: RegisterAccreditationDto,
): Promise<{ id: number; accessCode: string }> {
  const accessCode = generateAccessCode();

  try {
    return await withConnection(async (connection) => {
      const result = await connection.execute<{
        id: [number] | number;
      }>(
        `INSERT INTO accreditations (name, lastname, country, email, access_code)
         VALUES (:name, :lastname, :country, :email, :accessCode)
         RETURNING id INTO :id`,
        {
          name: dto.name,
          lastname: dto.lastname,
          country: dto.country,
          email: dto.email,
          accessCode,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true },
      );

      const rawId = result.outBinds?.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (typeof id !== "number" || !Number.isInteger(id)) {
        throw new Error("Oracle no devolvió un id válido para la inserción.");
      }

      return { id, accessCode };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}
