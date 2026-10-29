/**
 * Genera el código de acceso que se incrusta en el QR de la credencial.
 * Server-only: nunca se importa desde componentes cliente.
 */
const ACCESS_CODE_BYTES = 12;

export function generateAccessCode(): string {
  const bytes = new Uint8Array(ACCESS_CODE_BYTES);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += byte.toString(36).padStart(2, "0");
  }
  return code;
}
