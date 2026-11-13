"use server";

import { cookies } from "next/headers";
import { getAdminSession } from "./actions";
import { createSessionToken, hashSessionToken } from "./crypto";
import { mediaAccessSchema, type AccreditedMediaUser } from "./schemas";
import {
  endMediaSession,
  findAccreditationByEmailAndCode,
  findAccreditationByMediaSessionTokenHash,
  startMediaSession,
} from "./media-datasource";

const MEDIA_SESSION_COOKIE = "cipse_media_session";
const MEDIA_SESSION_TTL_HOURS = 12;
const MAX_ATTEMPTS_PER_MINUTE = 5;

export type MediaAccessState =
  | { kind: "admin"; name: string; email: string }
  | { kind: "accredited"; user: AccreditedMediaUser };

export type MediaLoginErrorCode =
  | "VALIDATION"
  | "INVALID"
  | "THROTTLED"
  | "DB_ERROR";

type MediaLoginResponse =
  | { ok: true; user: AccreditedMediaUser }
  | { ok: false; code: MediaLoginErrorCode; message: string };

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

/** Mensaje genérico: no revela si el correo existe o si el código falló. */
const invalidCredentialsMessage =
  "No pudimos validar la credencial. Revise su correo y el código de su QR.";

export async function loginMediaAccreditation(
  input: unknown,
): Promise<MediaLoginResponse> {
  const parsed = mediaAccessSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message:
        parsed.error.issues[0]?.message ?? invalidCredentialsMessage,
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (!registerAttempt(email)) {
    return {
      ok: false,
      code: "THROTTLED",
      message: "Demasiados intentos. Espere un minuto e intente de nuevo.",
    };
  }

  const user = await findAccreditationByEmailAndCode(
    email,
    parsed.data.accessCode,
  );

  if (!user) {
    return { ok: false, code: "INVALID", message: invalidCredentialsMessage };
  }

  const token = createSessionToken();
  const expiresAt = new Date(
    Date.now() + MEDIA_SESSION_TTL_HOURS * 60 * 60 * 1000,
  );

  try {
    await startMediaSession({
      accreditationId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });
  } catch (error) {
    console.error("[loginMediaAccreditation] No se pudo crear la sesión:", error);
    return {
      ok: false,
      code: "DB_ERROR",
      message:
        "No fue posible iniciar sesión. Intente de nuevo en unos minutos.",
    };
  }

  const store = await cookies();
  store.set(MEDIA_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true, user };
}

export async function getMediaAccess(): Promise<MediaAccessState | null> {
  const admin = await getAdminSession();

  if (admin) {
    return { kind: "admin", name: admin.name, email: admin.email };
  }

  const store = await cookies();
  const token = store.get(MEDIA_SESSION_COOKIE)?.value;
  if (!token || token.length !== 64) return null;

  const user = await findAccreditationByMediaSessionTokenHash(
    hashSessionToken(token),
  );

  return user ? { kind: "accredited", user } : null;
}

export async function logoutMediaAccreditation(): Promise<void> {
  const store = await cookies();
  const token = store.get(MEDIA_SESSION_COOKIE)?.value;

  if (token) {
    await endMediaSession(hashSessionToken(token));
  }

  store.delete(MEDIA_SESSION_COOKIE);
}
