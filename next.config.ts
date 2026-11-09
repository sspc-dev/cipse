import type { NextConfig } from "next";

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
  // Las cabeceras de seguridad (CSP con nonce, HSTS, etc.) las aplica el
  // proxy en runtime (proxy.ts), no aquí: next.config no debe importar
  // módulos locales, su transpilación en runtime los exige en disco.
};

export default nextConfig;
