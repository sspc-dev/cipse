# CIPSE XV — imagen de producción.
#
# Se usa `next start` (servidor completo) en lugar de `output: standalone`
# porque el proxy de enrutamiento por idioma (proxy.ts, redirección de / a
# /es / /en) solo corre con integridad en el servidor completo de esta
# versión. Las credenciales QR apuntan a /checkin?c=…, así que el runtime
# debe conservar ese comportamiento.

# ---------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Dependencias completas: el build necesita TypeScript y Tailwind.
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------- build
FROM deps AS build
WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build \
  && rm -rf /app/node_modules

# Dependencias solo de producción para el runtime.
RUN corepack enable pnpm \
  && cp package.json pnpm-lock.yaml pnpm-workspace.yaml /tmp \
  && cd /tmp \
  && pnpm install --frozen-lockfile --prod \
  && cd /app \
  && rm -rf /app/node_modules \
  && cp -R /tmp/node_modules /app/node_modules \
  && rm -rf /tmp/node_modules /tmp/package.json /tmp/pnpm-lock.yaml /tmp/pnpm-workspace.yaml

# ---------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios para el proceso del servidor.
RUN addgroup -S cipse && adduser -S cipse -G cipse

COPY --from=build /app/node_modules ./node_modules
# .next necesita permisos de escritura para cipse: el optimizador de imágenes
# escribe su caché en .next/cache/images durante el runtime.
COPY --from=build --chown=cipse:cipse /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/next.config.ts ./next.config.ts
# El proxy de idioma se carga desde el código fuente en el arranque del
# servidor completo de esta versión de Next.js.
COPY --from=build /app/proxy.ts ./proxy.ts

# El directorio de caché de imágenes debe existir y ser escribible por el
# proceso del servidor antes de cambiar al usuario sin privilegios.
RUN mkdir -p .next/cache/images && chown -R cipse:cipse .next/cache

USER cipse

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget --spider -q "http://127.0.0.1:${PORT}/es/register" || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start"]
