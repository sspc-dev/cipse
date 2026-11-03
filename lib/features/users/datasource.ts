import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import type { AdminUserListItem } from "./schemas";

type AdminUserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  is_active: number;
  created_at: Date;
};

export class DuplicateAdminEmailError extends Error {
  constructor() {
    super("Ya existe un usuario con este correo electrónico.");
    this.name = "DuplicateAdminEmailError";
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  const errno = (error as { errno?: number } | null)?.errno;
  const code = (error as { code?: string } | null)?.code;

  return errno === 1062 || code === "ER_DUP_ENTRY";
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const rows = await withConnection(async (connection) => {
    const [result] = await connection.query<AdminUserRow[]>(
      `SELECT id, name, email, is_active, created_at
       FROM admin_users
       ORDER BY created_at ASC, id ASC`,
    );

    return result;
  });

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  }));
}

export async function insertAdminUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<number> {
  try {
    return await withConnection(async (connection) => {
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)",
        [input.name, input.email, input.passwordHash],
      );

      if (typeof result.insertId !== "number" || result.insertId <= 0) {
        throw new Error("MySQL no devolvió un id válido para el usuario.");
      }

      return result.insertId;
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateAdminEmailError();
    }
    throw error;
  }
}

export async function updateAdminUser(input: {
  id: number;
  name: string;
  email: string;
}): Promise<void> {
  try {
    await withConnection(async (connection) => {
      await connection.query(
        "UPDATE admin_users SET name = ?, email = ? WHERE id = ?",
        [input.name, input.email, input.id],
      );
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateAdminEmailError();
    }
    throw error;
  }
}

export async function updateAdminUserPassword(input: {
  id: number;
  passwordHash: string;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query(
      "UPDATE admin_users SET password_hash = ? WHERE id = ?",
      [input.passwordHash, input.id],
    );
  });
}

export async function updateAdminUserActive(input: {
  id: number;
  active: boolean;
}): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query(
      "UPDATE admin_users SET is_active = ? WHERE id = ?",
      [input.active ? 1 : 0, input.id],
    );
  });
}
