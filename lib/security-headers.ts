/**
 * Cabeceras de seguridad construidas por el proxy (proxy.ts) para todas las
 * rutas, incluidos assets y el panel admin.
 *
 * CSP estricta con nonce: el proxy genera un valor único por request y Next.js
 * lo aplica automáticamente a sus scripts inline durante el renderizado
 * dinámico (ver guía content-security-policy de Next). Por ese requisito las
 * páginas públicas se renderizan dinámicamente; no hay caché s-maxage.
 *
 * `style-src-attr 'unsafe-inline'` es necesario porque React SSR emite
 * atributos `style="..."`; la directiva `style-src` queda limpia.
 *
 * `camera=(self)` es necesario para el escáner QR del panel interno.
 */

const isProduction = process.env.NODE_ENV === "production";

export function buildSecurityHeaders({ nonce }: { nonce: string }) {
  const cspDirectives = [
    "default-src 'self'",
    // En desarrollo React usa eval() para depuración (callstacks, HMR); la
    // producción nunca lo necesita.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isProduction ? "" : " 'unsafe-eval'"
    }`,
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
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

  return [
    { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
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
}

/** Aplica las cabeceras a una respuesta del middleware o a un `Headers`. */
export function applySecurityHeaders(headers: Headers, nonce: string): void {
  for (const { key, value } of buildSecurityHeaders({ nonce })) {
    headers.set(key, value);
  }
}
