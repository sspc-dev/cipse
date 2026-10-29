import type { RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import type { AdminUser } from "./schemas";

type AdminUserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  is_active: number;
};

type AdminSessionRow = RowDataPacket & {
  token_hash: string;
  admin_user_id: number;
  name: string;
  email: string;
  is_active: number;
};

export type AdminUserRecord = AdminUser & {
  passwordHash: string;
};

export async function findAdminByEmail(
  email: string,
): Promise<AdminUserRecord | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<AdminUserRow[]>(
      `SELECT id, name, email, password_hash, is_active
       FROM admin_users
       WHERE email = ?`,
      [email.trim().toLowerCase()],
    );

    return rows[0] ?? null;
  });

  if (!record || record.is_active !== 1) return null;

  return {
    id: Number(record.id),
    name: record.name,
    email: record.email,
    passwordHash: record.password_hash,
  };
}

export async function ensureAdminUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<"inserted" | "updated"> {
  return await withConnection(async (connection) => {
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM admin_users WHERE email = ?",
      [input.email],
    );

    if (existing.length > 0) {
      await connection.query(
        "UPDATE admin_users SET name = ?, password_hash = ?, is_active = 1 WHERE email = ?",
        [input.name, input.passwordHash, input.email],
      );
      await connection.commit();
      return "updated" as const;
    }

    await connection.query(
      "INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)",
      [input.name, input.email, input.passwordHash],
    );
    await connection.commit();
    return "inserted" as const;
  });
}

export async function startAdminSession(input: {
  adminUserId: number;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query(
      "DELETE FROM admin_sessions WHERE expires_at < CURRENT_TIMESTAMP",
    );
    await connection.query(
      `INSERT INTO admin_sessions (token_hash, admin_user_id, expires_at)
       VALUES (?, ?, ?)`,
      [input.tokenHash, input.adminUserId, input.expiresAt],
    );
    await connection.commit();
  });
}

export async function findAdminBySessionTokenHash(
  tokenHash: string,
): Promise<AdminUser | null> {
  const record = await withConnection(async (connection) => {
    const [rows] = await connection.query<AdminSessionRow[]>(
      `SELECT s.token_hash, s.admin_user_id, u.name, u.email, u.is_active
       FROM admin_sessions s
       INNER JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash],
    );

    return rows[0] ?? null;
  });

  if (!record || record.is_active !== 1) return null;

  return {
    id: Number(record.admin_user_id),
    name: record.name,
    email: record.email,
  };
}

export async function endAdminSession(tokenHash: string): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query(
      "DELETE FROM admin_sessions WHERE token_hash = ?",
      [tokenHash],
    );
    await connection.commit();
  });
}
