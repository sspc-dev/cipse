# CIPSE XV — imagen de producción.
#
# Se usa `next start` (servidor completo) en lugar de `output: standalone`
# porque el proxy de enrutamiento por idioma (proxy.ts, redirección de / a
# /es o /en) se compila a .next/server/middleware.js durante el build y el
# servidor completo lo carga desde ahí en producción. Las credenciales QR
# apuntan a /checkin?c=…, así que el runtime debe conservar ese comportamiento.
#
# Etapas:
#   deps      → dependencias completas (TypeScript, Tailwind: el build las exige)
#   build     → next build (deja .next con el middleware ya compilado)
#   prod-deps → dependencias solo de producción para el runtime
#   runtime   → servidor completo, usuario sin privilegios

# ---------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------- build
FROM deps AS build
WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------------------------------------------------------------- prod-deps
FROM node:22-alpine AS prod-deps
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Proceso sin privilegios: usamos el usuario `node` (uid/gid 1000) que trae
# la imagen. Coincidir con uid 1000 permite leer el PEM de OCI montado por
# bind mount (propietario típico del primer usuario del host, modo 600).
COPY --from=build /app/.next ./.next
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/next.config.ts ./next.config.ts

# El directorio de caché de imágenes debe existir y ser escribible por el
# proceso del servidor antes de cambiar al usuario sin privilegios.
RUN mkdir -p .next/cache/images && chown -R node:node .next

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget --spider -q "http://127.0.0.1:${PORT}/es/register" || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start"]
