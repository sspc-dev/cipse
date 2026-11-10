"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/features/auth/actions";
import { hashPassword } from "@/lib/features/auth/crypto";
import {
  DuplicateAdminEmailError,
  insertAdminUser,
  updateAdminUser,
  updateAdminUserActive,
  updateAdminUserPassword,
} from "./datasource";
import {
  createAdminUserSchema,
  resetAdminUserPasswordSchema,
  setAdminUserActiveSchema,
  updateAdminUserSchema,
  type UserActionResult,
} from "./schemas";

const sessionExpiredMessage =
  "La sesión expiró. Inicie sesión de nuevo para continuar.";

function firstIssueMessage(
  issues: { message: string }[],
  fallback: string,
): string {
  return issues[0]?.message ?? fallback;
}

export async function createAdminUser(input: unknown): Promise<UserActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, message: sessionExpiredMessage };

  const parsed = createAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: firstIssueMessage(
        parsed.error.issues,
        "Revise los datos del usuario.",
      ),
    };
  }

  try {
    await insertAdminUser({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: hashPassword(parsed.data.password),
    });
  } catch (error) {
    if (error instanceof DuplicateAdminEmailError) {
      return { ok: false, field: "email", message: error.message };
    }
    console.error("[createAdminUser] Error al crear usuario:", error);
    return {
      ok: false,
      message: "No fue posible crear el usuario. Intente de nuevo más tarde.",
    };
  }

  revalidatePath("/dashboard/usuarios");
  return { ok: true, message: "Usuario creado correctamente." };
}

export async function updateAdminUserAction(
  input: unknown,
): Promise<UserActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, message: sessionExpiredMessage };

  const parsed = updateAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: firstIssueMessage(
        parsed.error.issues,
        "Revise los datos del usuario.",
      ),
    };
  }

  try {
    await updateAdminUser({
      id: parsed.data.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof DuplicateAdminEmailError) {
      return { ok: false, field: "email", message: error.message };
    }
    console.error("[updateAdminUserAction] Error al actualizar:", error);
    return {
      ok: false,
      message:
        "No fue posible actualizar el usuario. Intente de nuevo más tarde.",
    };
  }

  revalidatePath("/dashboard/usuarios");
  return { ok: true, message: "Datos del usuario actualizados." };
}

export async function setAdminUserActiveAction(
  input: unknown,
): Promise<UserActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, message: sessionExpiredMessage };

  const parsed = setAdminUserActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Solicitud no válida." };
  }

  if (!parsed.data.active && parsed.data.id === session.id) {
    return {
      ok: false,
      message: "No puede desactivar la cuenta con la que inició sesión.",
    };
  }

  try {
    await updateAdminUserActive(parsed.data);
  } catch (error) {
    console.error("[setAdminUserActiveAction] Error al cambiar estado:", error);
    return {
      ok: false,
      message: "No fue posible cambiar el estado del usuario.",
    };
  }

  revalidatePath("/dashboard/usuarios");
  return {
    ok: true,
    message: parsed.data.active
      ? "Usuario activado. Ya puede iniciar sesión."
      : "Usuario desactivado. Sus sesiones ya no son válidas.",
  };
}

export async function resetAdminUserPasswordAction(
  input: unknown,
): Promise<UserActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, message: sessionExpiredMessage };

  const parsed = resetAdminUserPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      field: "password",
      message: firstIssueMessage(
        parsed.error.issues,
        "Ingrese una contraseña válida.",
      ),
    };
  }

  try {
    await updateAdminUserPassword({
      id: parsed.data.id,
      passwordHash: hashPassword(parsed.data.password),
    });
  } catch (error) {
    console.error(
      "[resetAdminUserPasswordAction] Error al restablecer contraseña:",
      error,
    );
    return {
      ok: false,
      message: "No fue posible restablecer la contraseña.",
    };
  }

  revalidatePath("/dashboard/usuarios");
  return { ok: true, message: "Contraseña actualizada correctamente." };
}
