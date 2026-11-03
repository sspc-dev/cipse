import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { withConnection } from "@/lib/db/mysql-client";
import type { MediaItem, MediaKind } from "./types";

type EventMediaRow = RowDataPacket & {
  id: number;
  day: number;
  kind: MediaKind;
  title: string;
  original_name: string;
  mime: string;
  size_bytes: number;
  created_at: Date;
};

type EventMediaWithKeyRow = EventMediaRow & { object_key: string };

function mapRow(row: EventMediaRow): MediaItem {
  return {
    id: Number(row.id),
    day: Number(row.day),
    kind: row.kind,
    title: row.title,
    originalName: row.original_name,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.created_at,
  };
}

export async function listEventMedia(): Promise<MediaItem[]> {
  const rows = await withConnection(async (connection) => {
    const [result] = await connection.query<EventMediaRow[]>(
      `SELECT id, day, kind, title, original_name, mime, size_bytes, created_at
       FROM event_media
       ORDER BY day ASC, created_at DESC, id DESC`,
    );

    return result;
  });

  return rows.map(mapRow);
}

export type EventMediaWithKey = MediaItem & { objectKey: string };

export async function findEventMediaById(
  id: number,
): Promise<EventMediaWithKey | null> {
  const row = await withConnection(async (connection) => {
    const [rows] = await connection.query<EventMediaWithKeyRow[]>(
      `SELECT id, day, kind, title, original_name, mime, size_bytes, created_at,
              object_key
       FROM event_media
       WHERE id = ?`,
      [id],
    );

    return rows[0] ?? null;
  });

  if (!row) return null;
  return { ...mapRow(row), objectKey: row.object_key };
}

export async function insertEventMedia(input: {
  day: number;
  kind: MediaKind;
  title: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  objectKey: string;
  createdBy: number;
}): Promise<number> {
  return await withConnection(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO event_media
         (day, kind, title, original_name, mime, size_bytes, object_key, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.day,
        input.kind,
        input.title,
        input.originalName,
        input.mime,
        input.sizeBytes,
        input.objectKey,
        input.createdBy,
      ],
    );

    if (typeof result.insertId !== "number" || result.insertId <= 0) {
      throw new Error("MySQL no devolvió un id válido para el archivo.");
    }

    return result.insertId;
  });
}

export async function deleteEventMediaRow(id: number): Promise<void> {
  await withConnection(async (connection) => {
    await connection.query("DELETE FROM event_media WHERE id = ?", [id]);
  });
}
