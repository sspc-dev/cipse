"use server";

import { headers } from "next/headers";
import { withConnection } from "@/lib/db/mysql-client";
import {
  normalizeRegisterInput,
  type RegisterActionResponse,
} from "./dto";
import { sendCredentialEmail, type EmailDelivery } from "./email";
import { DuplicateEmailError, insertAccreditation } from "./datasource";
import { registerSchema } from "./schema";

async function recordEmailDelivery(
  accreditationId: number,
): Promise<void> {
  try {
    await withConnection(async (connection) => {
      await connection.query(
        "UPDATE accreditations SET access_email_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
        [accreditationId],
      );
      await connection.commit();
    });
  } catch (error) {
    console.error(
      "[recordEmailDelivery] No se pudo registrar el estado del envío:",
      error,
    );
  }
}

export async function registerAccreditation(
  input: unknown,
): Promise<RegisterActionResponse> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message:
        parsed.error.issues[0]?.message ??
        "Revise los datos del formulario e intente de nuevo.",
    };
  }

  const dto = normalizeRegisterInput(parsed.data);

  try {
    const { id, accessCode } = await insertAccreditation(dto);
    const folio = `CIPSE-${String(id).padStart(4, "0")}`;

    const headerList = await headers();
    const host = headerList.get("host") ?? "localhost:3000";
    const protocol = headerList.get("x-forwarded-proto") ?? "http";
    const origin = `${protocol}://${host}`;

    const emailDelivery = await sendCredentialEmail({
      to: dto.email,
      folio,
      fullName: `${dto.name} ${dto.lastname}`,
      accessCode,
      origin,
    });

    if (emailDelivery.state === "sent") {
      await recordEmailDelivery(id);
    }

    return { ok: true, id, accessCode, emailDelivery };
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return { ok: false, code: "DUPLICATE_EMAIL", message: error.message };
    }
    console.error("[registerAccreditation] Error al insertar:", error);
    return {
      ok: false,
      code: "DB_ERROR",
      message:
        "No fue posible registrar la solicitud. Intente de nuevo más tarde.",
    };
  }
}
