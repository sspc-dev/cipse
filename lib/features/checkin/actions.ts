"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { adminKeySchema } from "./schemas";
import {
  findAccreditationByCode,
  markAttendance,
} from "./datasource";

const SESSION_COOKIE = "cipse_admin_session";
const SESSION_PURPOSE = "cipse-checkin-admin-v1";
const SESSION_TTL_HOURS = 8;

export type CheckinActionErrorCode =
  | "SESSION_REQUIRED"
  | "INVALID_CODE"
  | "DB_ERROR";

export type CheckinRecordSummary = {
  folio: string;
  name: string;
  lastname: string;
  country: string;
  status: string;
};

export type CheckinActionResponse =
  | {
      ok: false;
      code: CheckinActionErrorCode;
      message: string;
    }
  | {
      ok: true;
      alreadyCheckedIn: boolean;
      checkedInAt: string | null;
      record: CheckinRecordSummary;
    };

/*
 * La cookie no guarda la clave: guarda un HMAC de propósito fijo derivado
 * de ella (token de capacidad). La validación recalcula el HMAC esperado
 * con la clave del entorno y compara de forma constante.
 */
function expectedSessionToken(): string | null {
  const adminKey = process.env["ADMIN_CHECKIN_KEY"];
  if (!adminKey) return null;

  return crypto
    .createHmac("sha256", adminKey)
    .update(SESSION_PURPOSE)
    .digest("hex");
}

export async function hasAdminSession(): Promise<boolean> {
  const expected = expectedSessionToken();
  if (!expected) return false;

  const store = await cookies();
  const actual = store.get(SESSION_COOKIE)?.value;
  if (!actual || actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function authenticateAdmin(
  adminKey: string,
): Promise<{ ok: boolean }> {
  const parsed = adminKeySchema.safeParse(adminKey);
  if (!parsed.success) return { ok: false };

  const expected = process.env["ADMIN_CHECKIN_KEY"];

  if (
    !expected ||
    parsed.data.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(parsed.data), Buffer.from(expected))
  ) {
    return { ok: false };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, expectedSessionToken() ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });

  return { ok: true };
}

export async function registerAttendance(
  accessCode: string,
): Promise<CheckinActionResponse> {
  if (!(await hasAdminSession())) {
    return {
      ok: false,
      code: "SESSION_REQUIRED",
      message: "Se requiere la clave de acreditación para registrar asistencia.",
    };
  }

  try {
    const record = await findAccreditationByCode(accessCode);

    if (!record) {
      return {
        ok: false,
        code: "INVALID_CODE",
        message: "El código no corresponde a un registro válido.",
      };
    }

    const summary: CheckinRecordSummary = {
      folio: `CIPSE-${String(record.id).padStart(4, "0")}`,
      name: record.name,
      lastname: record.lastname,
      country: record.country,
      status: record.status,
    };

    if (record.checkedInAt) {
      return {
        ok: true,
        alreadyCheckedIn: true,
        checkedInAt: record.checkedInAt.toISOString(),
        record: summary,
      };
    }

    const adminName = (process.env["ADMIN_CHECKIN_USER"] ?? "Acreditación CIPSE").slice(
      0,
      120,
    );
    await markAttendance(accessCode, adminName);

    const updated = await findAccreditationByCode(accessCode);

    return {
      ok: true,
      alreadyCheckedIn: false,
      checkedInAt: updated?.checkedInAt?.toISOString() ?? null,
      record: summary,
    };
  } catch (error) {
    console.error("[registerAttendance] Error:", error);
    return {
      ok: false,
      code: "DB_ERROR",
      message:
        "No fue posible registrar la asistencia. Intente de nuevo más tarde.",
    };
  }
}
