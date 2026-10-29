"use server";

import { cookies } from "next/headers";
import { credentialsSchema, type AdminUser } from "./schemas";
import {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} from "./crypto";
import {
  findAdminBySessionTokenHash,
  endAdminSession,
  startAdminSession,
  findAdminByEmail,
} from "./datasource";

const SESSION_COOKIE = "cipse_admin_session";
const SESSION_TTL_HOURS = 8;
const MAX_ATTEMPTS_PER_MINUTE = 5;

type LoginResponse =
  | { ok: true; admin: AdminUser }
  | { ok: false; message: string };

export type AdminSession = AdminUser;

/** Throttle simple en memoria: se reinicia si el proceso reinicia. */
const attemptLog = new Map<string, number[]>();

function registerAttempt(email: string): boolean {
  const now = Date.now();
  const minuteAgo = now - 60_000;
  const attempts = (attemptLog.get(email) ?? []).filter(
    (timestamp) => timestamp > minuteAgo,
  );

  if (attempts.length >= MAX_ATTEMPTS_PER_MINUTE) {
    attemptLog.set(email, attempts);
    return false;
  }

  attempts.push(now);
  attemptLog.set(email, attempts);
  return true;
}

/** Sesión inválida genérica: no filtra si el usuario o la contraseña fallaron. */
const invalidCredentialsMessage =
  "Credenciales incorrectas. Verifique e intente de nuevo.";

export async function loginAdmin(input: unknown): Promise<LoginResponse> {
  const parsed = credentialsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? invalidCredentialsMessage };
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (!registerAttempt(email)) {
    return {
      ok: false,
      message: "Demasiados intentos. Espere un minuto e intente de nuevo.",
    };
  }

  const admin = await findAdminByEmail(email);
  const passwordOk =
    admin && verifyPassword(parsed.data.password, admin.passwordHash);

  if (!admin || !passwordOk) {
    return { ok: false, message: invalidCredentialsMessage };
  }

  return await startSessionForAdmin(admin);
}

async function startSessionForAdmin(admin: AdminUser): Promise<LoginResponse> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  try {
    await startAdminSession({
      adminUserId: admin.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });
  } catch (error) {
    console.error("[loginAdmin] No se pudo crear la sesión:", error);
    return {
      ok: false,
      message:
        "No fue posible iniciar sesión. Intente de nuevo en unos minutos.",
    };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true, admin: { id: admin.id, name: admin.name, email: admin.email } };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length !== 64) return null;

  return await findAdminBySessionTokenHash(hashSessionToken(token));
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await endAdminSession(hashSessionToken(token));
  }

  store.delete(SESSION_COOKIE);
}
