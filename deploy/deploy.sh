#!/usr/bin/env bash
# CIPSE XV — despliegue blue-green del stack de producción.
#
# Automatizado por .github/workflows/deploy.yml: el Actions runner del
# PROPIO servidor construye la imagen con docker build (tag local
# cipse:sha-<commit>) y ejecuta este script. También útil a mano en el
# servidor, desde la raíz del repo:
#
#   bash deploy/deploy.sh <imagen>        # tag local ya construido (o registry)
#   bash deploy/deploy.sh                 # despliega APP_IMAGE de .env o el último tag
#   bash deploy/deploy.sh --rollback      # vuelve al color anterior y su imagen
#
# Soporta imagen local (caso del pipeline) o de un registry: si el tag aún
# no existe en el almacén local del host, se intenta un pull de compose;
# si existe, no se toca el registry.
#
# Secuencia (el colo ACTIVO sigue sirviendo tráfico hasta el final):
#   0/6: preflight + alinear la base (traefik/db) al compose vigente
#        (up --no-deps; compose solo recrea contenedores cuya config
#        cambió: sin esto, un traefik viejo —de una versión anterior del
#        compose— no carga el router del provider file y la verificación
#        da 404 eterno) + reescribir el enrutamiento al color vivo
#        (o app-a en el primer despliegue). El routing es producto de la
#        ejecución (gitignored en el repo): el reset --hard del sync de
#        código del pipeline nunca puede pisarlo.
#   1/6: APP_IMAGE=<nuevo> pull del color INACTIVO (a/b) y recreate de ese
#        contenedor; el activo no se toca en todo el release.
#   2/6: esperar el healthcheck del contenedor nuevo (Dockerfile:
#        wget /es/register).
#   3/6: migraciones idempotentes (deploy/db-migrate.sh): el esquema se
#        sincroniza mientras la versión anterior sigue en servicio.
#   4/6: conmutación: reescribir deploy/dynamic/app-routing.yml hacia el
#        color nuevo — Traefik (provider file) recarga en caliente y el
#        tráfico cambia sin downtime.
#   5/6: verificación visible: HTTPS (o HTTP con redirect) local del host,
#        a través de Traefik, contra /es/register.
#   6/6: parar el color anterior (el contenedor se CONSERVA parado para el
#        rollback) y registrar el estado (deploy/state.env).
#
# En cualquier fallo posterior a la conmutación, revertir: volver el
# enrutamiento al color anterior, asegurar que sigue sirviendo y salir con
# error. Rollback manual: --rollback levanta el color PREVIOUS con SU imagen
# registrada (nunca :latest, para no pisarla con un despliegue posterior).
#
# Variables:
#   CIPSE_ENV_FILE    ruta alternativa del .env (por defecto <repo>/.env)
#   CIPSE_IMAGE       imagen por defecto cuando no se pasa argumento
#                     (por defecto ghcr.io/duartedc/cipse:latest)
#
# Requiere que preflight.sh esté OK (ejécutelo antes, con --fix si pinta).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${CIPSE_ENV_FILE:-$ROOT_DIR/.env}"
DEFAULT_IMAGE="${CIPSE_IMAGE:-ghcr.io/duartedc/cipse:latest}"
STATE_FILE="$ROOT_DIR/deploy/state.env"
ROUTING_FILE="$ROOT_DIR/deploy/dynamic/app-routing.yml"
HEALTH_PATH="/es/register"
HEALTH_TIMEOUT_S=180

COMPOSE=(docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.yml -f deploy/docker-compose.tls.yml)

log()    { printf '  %s\n' "$*"; }
die()    { printf '  ERROR %s\n' "$*" >&2; exit 1; }
other()  { [[ "$1" == "a" ]] && printf 'b' || printf 'a'; }

# ---------------------------------------------------------------- estado
state_get() {
  # sin archivo o sin clave → vacío sin romper set -euo pipefail
  local v
  v="$(grep -E "^$1=" "$STATE_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '[:space:]' || true)"
  printf '%s' "$v"
}

save_state() { # active active_img previous previous_img
  local tmp="$STATE_FILE.tmp"
  {
    printf 'ACTIVE=%s\nACTIVE_IMAGE=%s\nPREVIOUS=%s\nPREVIOUS_IMAGE=%s\n' "$1" "$2" "$3" "$4"
  } > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Colo activo según el estado; sin estado, por qué contenedor corre ahora.
detect_active() {
  local s
  s="$(state_get ACTIVE)"
  if [[ -n "$s" && ("$s" == "a" || "$s" == "b") ]]; then
    printf '%s' "$s"
    return
  fi
  if [[ "$(docker inspect -f '{{.State.Running}}' "$(cid a)" 2>/dev/null || true)" == "true" ]]; then
    printf 'a'
  elif [[ "$(docker inspect -f '{{.State.Running}}' "$(cid b)" 2>/dev/null || true)" == "true" ]]; then
    printf 'b'
  fi
}

# ------------------------------------------------------------ enrutamiento
# Regenera app-routing.yml hacia un color concreto (Traefik recarga al
# reescribir el archivo; mv es atómico dentro del mismo sistema de archivos).
write_routing() { # color
  local color="$1" tmp="$ROUTING_FILE.tmp"
  cat > "$tmp" <<EOF
http:
  routers:
    cipse-http:
      rule: "PathPrefix(\`/\`)"
      entryPoints:
        - web
      priority: 1
      service: cipse-app

    cipse-https:
      rule: "PathPrefix(\`/\`)"
      entryPoints:
        - websecure
      priority: 1
      service: cipse-app
      tls: true

  services:
    cipse-app:
      loadBalancer:
        servers:
          - url: "http://app-$color:3000"
EOF
  mv "$tmp" "$ROUTING_FILE"
}

# ------------------------------------------------------------ contenedores
cid() { # color → id del contenedor (puede estar parado)
  "${COMPOSE[@]}" ps -q "app-$1" 2>/dev/null || true
}

running() { # color → true si el contenedor está corriendo
  [[ "$(docker inspect -f '{{.State.Running}}' "$(cid "$1")" 2>/dev/null || true)" == "true" ]]
}

wait_service_healthy() { # servicio de compose (p. ej. app-a, traefik, db)
  local service="$1" id status deadline=$((SECONDS + HEALTH_TIMEOUT_S))
  id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
  [[ -n "$id" ]] || die "no hay contenedor de $service tras el up"
  while sleep 3; do
    status="$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null || echo missing)"
    case "$status" in
      healthy) log "$service: HEALTHY"; return 0 ;;
      unhealthy) die "$service: healthcheck UNHEALTHY; revise: docker logs ${id:0:12}" ;;
    esac
    (( SECONDS >= deadline )) && die "$service: healthcheck a $HEALTH_TIMEOUT_S s sin quedar healthy"
  done
}

# Trae la base del stack (proxy + db) al compose vigente. Compose es un
# no-op cuando su config coincide; recrea solo si cambió (p. ej. tras una
# actualización del compose en el repo) y arranca todo de cero en un host
# nuevo. Sin esto, un traefik con config/montajes anteriores NO cargaría el
# router del provider file (app-routing.yml) y la verificación daría 404.
ensure_infra() {
  "${COMPOSE[@]}" up -d --no-deps traefik db >/dev/null \
    || die "no se pudo levantar la base del stack (traefik/db)"
  wait_service_healthy traefik
  wait_service_healthy db
}

# ------------------------------------------------------------- verificación
# Verifica el endpoint público a través de Traefik desde el propio host.
# Primero HTTPS directo (:443); si falla, HTTP con -L (redirect a HTTPS).
# Setea LAST_HTTP_CODE para diagnóstico a posteriori (por ejemplo, 404:
# ningún router de Traefik encajó; 502: el app falla; 000: ni conecta).
LAST_HTTP_CODE="?"
verify_via_traefik() {
  local p hp code
  p="$(grep -E '^TRAEFIK_HTTPS_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '[:space:]"' || true)"
  hp="${p:-443}"
  # -sS: errors a stderr (suprimido); con -w queda SOLO el código de estado.
  code="$(curl -sS -k --max-time 10 -o /dev/null -w '%{http_code}' "https://127.0.0.1:${hp}${HEALTH_PATH}" 2>/dev/null || true)"
  if [[ "$code" == 200 ]]; then
    LAST_HTTP_CODE="200"
    log "verificación HTTPS por Traefik: 200 $HEALTH_PATH"
    return 0
  fi
  code="$(curl -sSL -k --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${hp}${HEALTH_PATH}" 2>/dev/null || true)"
  LAST_HTTP_CODE="$code"
  [[ "$code" == 200 ]] && log "verificación HTTP→HTTPS por Traefik: 200 $HEALTH_PATH" && return 0
  log "$HEALTH_PATH a través de Traefik respondió '$code' (se esperaba 200)" >&2
  case "$code" in
    404) log "   404 = ningún router encajó: traefik no cargó el router del provider file." >&2 ;;
    502|503) log "   $code = el app no responde; revise logs del colo." >&2 ;;
    000) log "   000 = ni conexión: ¿está traefik arriba y publicando el puerto?" >&2 ;;
  esac
  return 1
}

# ---------------------------------------------------------------- deploy
rollback_traffic() { # color  — conmutar de vuelta y asegurar servicio
  local color="$1" img="$2"
  [[ -n "$img" ]] && APP_IMAGE="$img" "${COMPOSE[@]}" up -d --no-deps "app-$color" >/dev/null 2>&1 || true
  "${COMPOSE[@]}" start "app-$color" >/dev/null 2>&1 || true
  write_routing "$color"
  if ! verify_via_traefik; then
    log "WARNING la verificación tras la reversión tampoco pasa; intervención manual" >&2
    log "             revise traefik (404 = router no cargado; 502 = app caído, logs del color):" >&2
    log "             docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.tls.yml logs traefik" >&2
  fi
}

cmd_deploy() { # imagen
  local new_image="$1" target active old_image old_old prev_old
  active="$(detect_active)"
  if [[ -n "$active" ]]; then
    target="$(other "$active")"
  else
    target="a"
    log "primer despliegue detectado: colo destino app-a"
  fi

  # 0/6a. Preflight: valida host y corrige lo seguro (rutas de certs/PEM,
  #       overrides obsoletos, router duplicado, directorios fantasma).
  bash deploy/preflight.sh --fix

  # 0/6b. Alinear la base al compose vigente y reescribir el routing al
  #       color vivo. Compose es no-op cuando la config coincide; recrea
  #       solo si cambió (p. ej. tras actualizar el compose en el repo) y
  #       arranca todo de cero en un host nuevo. Sin esto, un traefik con
  #       config o montajes anteriores NO cargaría el router del provider
  #       file (app-routing.yml) y la verificación daría 404.
  ensure_infra
  log "enrutamiento apuntando a app-${active:-a}"
  write_routing "${active:-a}"

  # 1. Imagen del colo activo (para revertir sin pisar :latest).
  old_image=""
  if [[ -n "$active" ]]; then
    old_image="$(state_get ACTIVE_IMAGE)"
    [[ -n "$old_image" ]] || old_image="$(docker inspect -f '{{.Config.Image}}' "$(cid "$active")" 2>/dev/null || true)"
  fi

  echo "== 1/6 imagen y recreate del colo inactivo app-$target =="
  # La imagen del pipeline se construye en el host (cipse:sha-<commit>):
  # si ya está en el almacén local NO se consulta registry alguno; solo si
  # falta se intenta el pull (despliegues manuales desde un registry).
  if ! docker image inspect "$new_image" >/dev/null 2>&1; then
    APP_IMAGE="$new_image" "${COMPOSE[@]}" pull "app-$target" >/dev/null 2>&1 \
      || die "$new_image no existe en el host y su pull falló (¿construida por el runner? ¿docker login si viene de un registry?)"
  fi
  APP_IMAGE="$new_image" "${COMPOSE[@]}" up -d --no-deps "app-$target" \
    || die "up del colo app-$target falló"

  echo "== 2/6 healthcheck del app-$target (nuevo) =="
  wait_service_healthy "app-$target"

  echo "== 3/6 migraciones idempotentes =="
  bash deploy/db-migrate.sh || die "migraciones fallaron; tráfico sigue en $([ -n "$active" ] && echo app-$active || echo el colo previo)"

  echo "== 4/6 conmutación de tráfico → app-$target =="
  write_routing "$target"
  sleep 2  # margen para la recarga del provider file de Traefik

  echo "== 5/6 verificación a través de Traefik =="
  if ! verify_via_traefik; then
    if [[ -n "$active" ]]; then
      echo "ERROR verificación falló tras conmutar; revirtiendo a app-$active" >&2
      rollback_traffic "$active" "$old_image"
      die "despliegue revertido a app-$active; revise logs del nuevo colo: docker compose ... logs app-$target"
    fi
    die "verificación falló en el primer despliegue (código $LAST_HTTP_CODE); revise logs: docker compose ... logs app-$target; si es 404, véa también logs/inspect de traefik"
  fi

  echo "== 6/6 congelar colo anterior y estado =="
  if [[ -n "$active" ]]; then
    "${COMPOSE[@]}" stop "app-$active" >/dev/null 2>&1 || true
    save_state "$target" "$new_image" "$active" "$old_image"
    log "estado: ACTIVE=app-$target ($new_image) · PREVIOUS=app-$active ($old_image, conservado parado)"
  else
    save_state "$target" "$new_image" "" ""
    log "estado: ACTIVE=app-$target ($new_image) · sin colo previo"
  fi

  echo
  echo "Despliegue completo. Rollback manual al colo anterior:"
  echo "  bash deploy/deploy.sh --rollback"
}

# --------------------------------------------------------------- rollback
cmd_rollback() {
  local target prev_img active active_img
  target="$(state_get PREVIOUS)"
  [[ -n "$target" ]] || die "no hay colo PREVIOUS en $STATE_FILE para regresar"
  prev_img="$(state_get PREVIOUS_IMAGE)"
  active="$(state_get ACTIVE)"
  [[ -n "$active" ]] || die "estado inconsistente: PREVIOUS=$target pero ACTIVE vacío"
  active_img="$(state_get ACTIVE_IMAGE)"
  [[ "$target" != "$active" ]] || die "estado inconsistente: ACTIVE y PREVIOUS son el mismo colo"

  echo "== rollback de app-$active → app-$target ($prev_img) =="
  ensure_infra
  APP_IMAGE="$prev_img" "${COMPOSE[@]}" up -d --no-deps "app-$target" >/dev/null 2>&1 || true
  wait_service_healthy "app-$target"

  write_routing "$target"
  sleep 2

  if ! verify_via_traefik; then
    rollback_traffic "$active" "$active_img"
    die "verificación del rollback falló; tráfico devuelto a app-$active"
  fi

  "${COMPOSE[@]}" stop "app-$active" >/dev/null 2>&1 || true
  save_state "$target" "$prev_img" "$active" "$active_img"
  log "tráfico de vuelta en app-$target ($prev_img); app-$active conservado parado"
  log "para repetir rollback:"
  log "  bash deploy/deploy.sh --rollback"
}

# ------------------------------------------------------------------ main
usage() {
  cat >&2 <<EOF
Uso: bash deploy/deploy.sh <imagen>   # despliega la imagen indicada
      (sin argumento usa CIPSE_IMAGE, o $DEFAULT_IMAGE)
     bash deploy/deploy.sh --rollback # vuelve al colo PREVIOUS
EOF
  exit 64
}

main() {
  # Preflight integrado: deploy.sh es la única puerta de entrada del
  # pipeline (y del operador) — dentro corre la validación del host.
  bash deploy/preflight.sh --fix

  if [[ "${1:-}" == "--rollback" ]]; then
    cmd_rollback
  elif [[ $# -eq 0 ]]; then
    cmd_deploy "$DEFAULT_IMAGE"
  elif [[ $# -eq 1 && "$1" != --* ]]; then
    cmd_deploy "$1"
  else
    usage
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
