import type { RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import type { AccreditedMediaUser } from "./schemas";

type AccreditationRow = RowDataPacket & {
  id: number;
  name: string;
  lastname: string;
  email: string;
};

type MediaSessionRow = RowDataPacket & {
  id: number;
  name: string;
  lastname: string;
  email: string;
};

function mapAccreditation(row: AccreditationRow): AccreditedMediaUser {
  return {
    id: Number(row.id),
    name: row.name,
    lastname: row.lastname,
    email: row.email,
  };
}

export async function findAccreditationByEmailAndCode(
  email: string,
  accessCode: string,
): Promise<AccreditedMediaUser | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<AccreditationRow[]>(
      `SELECT id, name, lastname, email
       FROM accreditations
       WHERE email = ? AND access_code = ?`,
      [email.trim().toLowerCase(), accessCode],
    );

    return rows[0] ?? null;
  });

  return record ? mapAccreditation(record) : null;
}

export async function startMediaSession(input: {
  accreditationId: number;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query(
      "DELETE FROM media_sessions WHERE expires_at < CURRENT_TIMESTAMP",
    );
    await connection.query(
      `INSERT INTO media_sessions (token_hash, accreditation_id, expires_at)
       VALUES (?, ?, ?)`,
      [input.tokenHash, input.accreditationId, input.expiresAt],
    );
    await connection.commit();
  });
}

export async function findAccreditationByMediaSessionTokenHash(
  tokenHash: string,
): Promise<AccreditedMediaUser | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<MediaSessionRow[]>(
      `SELECT s.accreditation_id AS id, a.name, a.lastname, a.email
       FROM media_sessions s
       INNER JOIN accreditations a ON a.id = s.accreditation_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash],
    );

    return rows[0] ?? null;
  });

  return record ? mapAccreditation(record) : null;
}

export async function endMediaSession(tokenHash: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query("DELETE FROM media_sessions WHERE token_hash = ?", [
      tokenHash,
    ]);
    await connection.commit();
  });
}
