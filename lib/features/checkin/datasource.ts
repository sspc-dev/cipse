import oracledb from "oracledb";
import { withConnection } from "@/lib/db/oracle-client";

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

type AccreditationRow = {
  ID: [number] | number;
  NAME: string;
  LASTNAME: string;
  COUNTRY: string;
  EMAIL: string;
  STATUS: string;
  CHECKED_IN_AT: Date | null;
  CHECKED_IN_BY: string | null;
};

function isUniqueRow(row: AccreditationRow): boolean {
  const id = Array.isArray(row.ID) ? row.ID[0] : row.ID;
  return typeof id === "number" || typeof id === "bigint";
}

export async function findAccreditationByCode(
  accessCode: string,
): Promise<AccreditationRecord | null> {
  const record = await withConnection(async (connection) => {
    const result = await connection.execute<AccreditationRow>(
      `SELECT id, name, lastname, country, email, status,
              checked_in_at, checked_in_by
       FROM accreditations
       WHERE access_code = :accessCode`,
      { accessCode },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const row = result.rows?.[0];
    return row && isUniqueRow(row) ? row : null;
  });

  if (!record) return null;

  const id = Array.isArray(record.ID) ? record.ID[0] : record.ID;

  return {
    id: Number(id),
    name: record.NAME,
    lastname: record.LASTNAME,
    country: record.COUNTRY,
    email: record.EMAIL,
    status: record.STATUS,
    checkedInAt: record.CHECKED_IN_AT,
    checkedInBy: record.CHECKED_IN_BY,
  };
}

export async function markAttendance(
  accessCode: string,
  checkedInBy: string,
): Promise<boolean> {
  return await withConnection(async (connection) => {
    const result = await connection.execute(
      `UPDATE accreditations
       SET checked_in_at = SYSTIMESTAMP, checked_in_by = :checkedInBy
       WHERE access_code = :accessCode AND checked_in_at IS NULL`,
      { accessCode, checkedInBy },
    );

    const updated = (result.rowsAffected ?? 0) > 0;
    await connection.commit();

    return updated;
  });
}
