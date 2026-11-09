/**
 * Cabeceras de seguridad compartidas entre `next.config.ts` (páginas y
 * archivos estáticos) y `proxy.ts` (respuestas emitidas por el middleware,
 * que no pasan por la configuración de headers de Next).
 *
 * Se aplican por cabecera, sin nonce: los scripts de arranque de Next son
 * inline y un CSP con nonce obligaría a renderizado dinámico de todas las
 * páginas, anulando el caché del sitio público. Esa limitación se acepta de
 * forma consciente; el resto de directivas sigue mitigando XSS, clickjacking
 * e inyección de recursos.
 *
 * `camera=(self)` es necesario para el escáner QR del panel interno.
 */

const isProduction = process.env.NODE_ENV === "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // En desarrollo React usa eval() para depuración (callstacks, HMR); la
  // producción nunca lo necesita y mantiene script-src estricto.
  `script-src 'self' 'unsafe-inline'${
    isProduction ? "" : " 'unsafe-eval'"
  }`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // En desarrollo el sitio se sirve por HTTP y forzar HTTPS rompería los
  // recursos del propio localhost; solo se envía en producción.
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
];

export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
] as const;

/** Aplica las cabeceras a una respuesta del middleware o a un `Headers`. */
export function applySecurityHeaders(headers: Headers): void {
  for (const { key, value } of SECURITY_HEADERS) {
    headers.set(key, value);
  }
}
