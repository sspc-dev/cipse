"use server";

import { accessCodeSchema } from "./schemas";
import {
  findAccreditationByCode,
  registerAttendanceByDay,
} from "./datasource";
import { getAdminSession } from "@/lib/features/auth/actions";

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
      /** Ya existía asistencia para hoy (primera lectura del día ya registrada). */
      alreadyToday: boolean;
      /** Hora de la asistencia del día actual. */
      attendedAt: string;
      /** Total de días con asistencia del delegado (incluido hoy). */
      attendanceDays: number;
      record: CheckinRecordSummary;
    };

export async function registerAttendance(
  accessCode: string,
): Promise<CheckinActionResponse> {
  const session = await getAdminSession();

  if (!session) {
    return {
      ok: false,
      code: "SESSION_REQUIRED",
      message:
        "Inicie sesión de acreditador para registrar asistencia.",
    };
  }

  const parsed = accessCodeSchema.safeParse(accessCode);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_CODE",
      message: "El código no corresponde a un registro válido.",
    };
  }

  try {
    const result = await registerAttendanceByDay(
      parsed.data,
      session.name.slice(0, 120),
    );

    if (!result) {
      return {
        ok: false,
        code: "INVALID_CODE",
        message: "El código no corresponde a un registro válido.",
      };
    }

    return {
      ok: true,
      alreadyToday: !result.created,
      attendedAt: result.attendedAt.toISOString(),
      attendanceDays: result.attendanceDays,
      record: {
        folio: `CIPSE-${String(result.record.id).padStart(4, "0")}`,
        name: result.record.name,
        lastname: result.record.lastname,
        country: result.record.country,
        status: result.record.status,
      },
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

export async function lookupAccreditation(
  accessCode: string,
): Promise<CheckinActionResponse> {
  const session = await getAdminSession();

  if (!session) {
    return {
      ok: false,
      code: "SESSION_REQUIRED",
      message: "Inicie sesión de acreditador para consultar credenciales.",
    };
  }

  const parsed = accessCodeSchema.safeParse(accessCode);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_CODE",
      message: "El código no corresponde a un registro válido.",
    };
  }

  try {
    const record = await findAccreditationByCode(parsed.data);

    if (!record) {
      return {
        ok: false,
        code: "INVALID_CODE",
        message: "El código no corresponde a un registro válido.",
      };
    }

    return {
      ok: true,
      alreadyToday: false,
      attendedAt: record.checkedInAt?.toISOString() ?? "",
      attendanceDays: 0,
      record: {
        folio: `CIPSE-${String(record.id).padStart(4, "0")}`,
        name: record.name,
        lastname: record.lastname,
        country: record.country,
        status: record.status,
      },
    };
  } catch (error) {
    console.error("[lookupAccreditation] Error:", error);
    return {
      ok: false,
      code: "DB_ERROR",
      message: "No fue posible consultar la credencial. Intente de nuevo.",
    };
  }
}
