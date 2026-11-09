import type { NextConfig } from "next";
// Ojo: el config se transpila en runtime (`next start`) y este import se
// resuelve en disco; todo módulo importado aquí debe copiarse al runtime
// image (ver stage `runtime` del Dockerfile).
import { SECURITY_HEADERS } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // Evita revelar el framework en cada respuesta (alerta ZAP X-Powered-By).
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // El runtime de producción usa `next start` (servidor completo) para que el
  // proxy de idioma (proxy.ts) redirija / a la ruta regional.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Cubre páginas y también los assets de `_next/static`, donde el escaneo
  // detectó ausencia de HSTS y de X-Content-Type-Options.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
