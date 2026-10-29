/**
 * Utilidades server-only para contraseñas y tokens de sesión de acreditadores.
 * Nunca importar desde componentes cliente.
 */
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N estándar de OWASP para login interactivo.
const SESSION_TOKEN_BYTES = 32;

/**
 * Formato almacenado: scrypt$<salt-b64>$<hash-b64>. Cada hash lleva un salt
 * propio, de modo que la verificación es autónoma por usuario.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);

  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(
  password: string,
  storedHash: string,
): boolean {
  const [scheme, saltB64, hashB64] = storedHash.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    if (expected.length !== SCRYPT_KEYLEN) return false;

    const actual = scryptSync(password, salt, SCRYPT_KEYLEN);

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

/** En la base solo se guarda el hash del token (el robo de la BD no habilita sesiones). */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
