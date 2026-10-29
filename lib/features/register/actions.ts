"use server";

import {
  normalizeRegisterInput,
  type RegisterActionResponse,
} from "./dto";
import { DuplicateEmailError, insertAccreditation } from "./datasource";
import { registerSchema } from "./schema";

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
    return { ok: true, id, accessCode };
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
