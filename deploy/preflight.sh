#!/usr/bin/env bash
# CIPSE XV — preflight del despliegue de producción.
#
# Verifica el estado del host antes de `docker compose up` con el overlay
# TLS y, con --fix, corrige de forma segura los problemas detectados.
#
# Comprobaciones:
#   - compose resuelve el stack con el .env indicado;
#   - las rutas montadas (cert/key/PEM OCI) existen y son ARCHIVOS, no
#     directorios (Docker crea un directorio vacío cuando la ruta de origen
#     de un bind mount no existe; Traefik luego falla con "is a directory");
#   - el PEM de OCI es legible por uid 1000 (la app corre como `node`);
#   - el .env no conserva overrides TLS_*_HOST_PATH / OCI_PEM_HOST_PATH
#     obsoletos que apunten a rutas inexistentes;
#   - no hay contenedores antiguos registrando el router `cipse` (causa
#     "router defined multiple times with different configurations");
#   - el app-routing.yml del provider file apunta a un color existente
#     (app-a o app-b); si AÚN NO EXISTE (primer despliegue) se advierte:
#     deploy.sh lo genera en su paso 0;
#   - no quedan directorios vacíos creados por Docker en /etc/ssl.
#
# --fix aplica solo acciones seguras e idempotentes:
#   - comenta líneas obsoletas del .env (backup .env.bak.<timestamp>);
#   - elimina con rmdir directorios vacíos en rutas de archivo;
#   - elimina contenedores que registran el router `cipse` y no son del
#     stack actual.
#
# Uso (desde la raíz del repo):
#   bash deploy/preflight.sh          # solo comprobar
#   bash deploy/preflight.sh --fix    # comprobar y corregir
#
# Variables:
#   CIPSE_ENV_FILE   ruta alternativa del .env (por defecto <repo>/.env)

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${CIPSE_ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT_DIR/deploy/docker-compose.yml" -f "$ROOT_DIR/deploy/docker-compose.tls.yml")
FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

problems=0
fixed=0
env_backed_up=0
ok()   { printf '  OK     %s\n' "$*"; }
warn() { printf '  WARN   %s\n' "$*"; }
err()  { printf '  ERROR  %s\n' "$*"; problems=$((problems + 1)); }
fix()  { printf '  FIX    %s\n' "$*"; fixed=$((fixed + 1)); }

backup_env() {
  [[ $env_backed_up -eq 1 ]] && return
  local backup="$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
  cp -- "$ENV_FILE" "$backup" && env_backed_up=1 && printf '  FIX    backup del .env en %s\n' "$backup"
}

resolve_mount() {
  local target="$1"
  "${COMPOSE[@]}" config 2>/dev/null | awk -v t="$target" '
    /^[[:space:]]*source:/ {
      sub(/^[[:space:]]*source:[[:space:]]*/, "")
      src = $0
    }
    /^[[:space:]]*target:/ {
      sub(/^[[:space:]]*target:[[:space:]]*/, "")
      if ($0 == t) { print src; exit }
    }
  '
}

check_mount() {
  local target="$1" kind="$2" src
  src="$(resolve_mount "$target")"
  if [[ -z "$src" ]]; then
    err "no se pudo resolver el origen del montaje $target"
    return
  fi
  if [[ ! -e "$src" ]]; then
    err "$src no existe (origen de $target)"
    return
  fi
  if [[ -d "$src" ]]; then
    if [[ $FIX -eq 1 ]]; then
      if sudo -n rmdir -- "$src" 2>/dev/null || rmdir -- "$src" 2>/dev/null; then
        fix "$src era un directorio vacío; eliminado (Docker lo creó al no existir el archivo)"
        err "falta el archivo real en $src (origen de $target)"
        return
      fi
      err "$src es un directorio no vacío; revíselo a mano: sudo rmdir '$src'"
      return
    fi
    err "$src es un DIRECTORIO, no un archivo; ejecute: sudo rmdir '$src'"
    return
  fi
  [[ -f "$src" ]] || { err "$src no es un archivo regular (origen de $target)"; return; }
  ok "$src → $target"

  if [[ "$kind" == "oci" ]]; then
    local uid gid mode
    read -r uid gid mode < <(stat -c '%u %g %a' -- "$src")
    local oct
    oct=$((8#$mode))
    if [[ "$uid" == "1000" ]] || { [[ "$gid" == "1000" ]] && (( oct & 0040 )); } || (( oct & 0004 )); then
      ok "PEM de OCI legible por uid 1000 (uid=$uid gid=$gid modo=$mode)"
    else
      warn "PEM de OCI no legible por uid 1000 (uid=$uid gid=$gid modo=$mode); ejecute: sudo chown 1000: '$src'"
    fi
  fi
}

echo "== compose =="
if ! compose_out="$("${COMPOSE[@]}" config 2>&1)"; then
  printf '%s\n' "$compose_out" | sed 's/^/  /'
  echo
  echo "Preflight falló: compose no puede resolver el stack."
  exit 1
fi
ok "deploy/docker-compose.yml + deploy/docker-compose.tls.yml resuelven"

echo "== rutas de archivos en el host =="
check_mount /run/certs/cipse/cert.pem tls
check_mount /run/certs/cipse/key.pem tls
check_mount /run/secrets/oci/key.pem oci

echo "== .env =="
if [[ ! -f "$ENV_FILE" ]]; then
  err "$ENV_FILE no existe (la app y la base lo necesitan vía env_file)"
else
  malformed="$(grep -nE 'TLS_(CERT|KEY)_HOST_PATH|OCI_PEM_HOST_PATH' "$ENV_FILE" | grep -vE '^[0-9]+:[[:space:]]*#' | grep -vE '^[0-9]+:[[:space:]]*(TLS_CERT_HOST_PATH|TLS_KEY_HOST_PATH|OCI_PEM_HOST_PATH)=' || true)"
  stale="$(grep -nE '^[[:space:]]*(TLS_CERT_HOST_PATH|TLS_KEY_HOST_PATH|OCI_PEM_HOST_PATH)=' "$ENV_FILE" | grep -vE '^[0-9]+:[[:space:]]*#' || true)"

  if [[ -n "$malformed" ]]; then
    err "líneas mal formadas en .env (nombres de variable corruptos):"
    printf '%s\n' "$malformed" | sed 's/^/         /'
    if [[ $FIX -eq 1 ]]; then
      backup_env
      while IFS= read -r n; do
        sed -i "${n}s/^[[:space:]]*/# /" "$ENV_FILE"
      done < <(printf '%s\n' "$malformed" | cut -d: -f1)
      fix "líneas mal formadas comentadas en .env"
    fi
  fi

  if [[ -n "$stale" ]]; then
    while IFS= read -r entry; do
      local_line="${entry#*:}"
      key="${local_line%%=*}"
      key="${key#"${key%%[![:space:]]*}"}"
      value="${local_line#*=}"
      value="${value%\"}"; value="${value#\"}"
      value="${value%\'}"; value="${value#\'}"
      if [[ -f "$value" ]]; then
        ok "$key apunta a un archivo existente ($value)"
      else
        err "$key=$value apunta a una ruta que no es un archivo"
        if [[ $FIX -eq 1 ]]; then
          n="${entry%%:*}"
          backup_env
          sed -i "${n}s/^/# /" "$ENV_FILE"
          fix "$key comentado en .env (el valor por defecto /etc/ssl/certs aplica)"
        fi
      fi
    done <<< "$stale"
  fi

  if [[ -z "$malformed" && -z "$stale" ]]; then
    ok "sin overrides de rutas TLS/OCI en .env (aplican los valores por defecto)"
  fi
fi

echo "== contenedores con el router 'cipse' =="
# El router vive ahora en el provider file (app-routing.yml); las labels
# solo sobreviven en contenedores legacy que rescatan el docker de antes.
# Excluimos los apps del stack actual (app-a/app-b) por nombre de servicio.
mapfile -t conflicting < <(docker ps -a \
  --filter 'label=traefik.http.routers.cipse.rule' \
  --format '{{.Names}}' 2>/dev/null | grep -vE '^cipse-prod-app-[ab]-[0-9]+$' || true)
if [[ ${#conflicting[@]} -eq 0 || -z "${conflicting[0]}" ]]; then
  ok "no hay contenedores ajenos registrando el router 'cipse'"
else
  for name in "${conflicting[@]}"; do
    [[ -z "$name" ]] && continue
    err "contenedor ajeno con el router 'cipse': $name"
    if [[ $FIX -eq 1 ]]; then
      if docker rm -f "$name" >/dev/null 2>&1; then
        fix "contenedor $name eliminado (evitaba el router duplicado)"
      else
        err "no se pudo eliminar $name; ejecute: docker rm -f $name"
      fi
    fi
  done
fi

echo "== enrutamiento del app (provider file) =="
routing_file="$ROOT_DIR/deploy/dynamic/app-routing.yml"
if [[ ! -f "$routing_file" ]]; then
  # Primer despliegue legítimo: el pipeline solo SEMBRA app-routing.yml si
  # falta (rsync nunca pisa el estado del servidor) y deploy.sh regenera
  # el enrutamiento en su paso 0, después de este preflight. No bloquear.
  warn "no existe $routing_file (deploy.sh lo genera en el paso 0; en un stack en producción indica que el enrutamiento Traefik se perdió)"
elif ! grep -q 'http://app-[ab]:3000' "$routing_file"; then
  err "$routing_file no apunta a app-a ni app-b; regenere con deploy.sh o restaure el repo"
else
  color="$(grep -oE 'http://app-[ab]:3000' "$routing_file" | head -n1 | cut -d/ -f3 | cut -d: -f1 | cut -c5 )"
  ok "$routing_file → colo activo app-$color"
fi

echo "== directorios vacíos creados por Docker en /etc/ssl =="
mapfile -t straydirs < <(find /etc/ssl -maxdepth 2 -mindepth 1 -type d \( -name '*pem*' -o -name '*key*' \) 2>/dev/null || true)
if [[ ${#straydirs[@]} -eq 0 || -z "${straydirs[0]}" ]]; then
  ok "sin directorios sospechosos en /etc/ssl"
else
  for dir in "${straydirs[@]}"; do
    [[ -z "$dir" ]] && continue
    err "directorio sospechoso en la ruta de un archivo: $dir"
    if [[ $FIX -eq 1 ]]; then
      if sudo -n rmdir -- "$dir" 2>/dev/null; then
        fix "$dir eliminado (vacío)"
      else
        warn "no se pudo eliminar $dir automáticamente; ejecute: sudo rmdir '$dir'"
      fi
    fi
  done
fi

echo
if [[ $problems -eq 0 ]]; then
  echo "Preflight OK. Puede desplegar con:"
  echo "  docker compose --env-file .env -f deploy/docker-compose.yml -f deploy/docker-compose.tls.yml up -d"
  exit 0
fi

echo "Preflight con $problems problema(s) y $fixed corrección(es)."
if [[ $FIX -eq 0 ]]; then
  echo "Vuelva a ejecutar con --fix para aplicar las correcciones seguras."
else
  echo "Revise los ERROR restantes (pueden requerir sudo) y reintente."
fi
exit 1
