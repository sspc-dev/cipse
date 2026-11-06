#!/usr/bin/env bash
# CIPSE XV — sincroniza el esquema MySQL aplicando db/sql/NNN_*.sql en orden.
#
# Las migraciones son idempotentes: se pueden aplicar sobre un volumen nuevo
# o sobre uno ya inicializado (p. ej. producción creada antes de que
# existieran todas las tablas) sin duplicar datos ni perder información.
# Es seguro ejecutarlo las veces que haga falta.
#
# Credenciales: se leen del entorno del propio contenedor (MYSQL_USER,
# MYSQL_PASSWORD, MYSQL_DATABASE), nunca de la línea de comandos del host.
#
# Uso (desde la raíz del repo):
#   bash deploy/db-migrate.sh                 # autodetecta cipse-prod-db-1 / cipse-db
#   bash deploy/db-migrate.sh cipse-db        # contenedor explícito
#   DB_CONTAINER=cipse-prod-db-1 bash deploy/db-migrate.sh
#
# El contenedor MySQL debe estar en ejecución.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_DIR="$ROOT_DIR/db/sql"

container="${1:-${DB_CONTAINER:-}}"
if [[ -z "$container" ]]; then
  for candidate in cipse-prod-db-1 cipse-db; do
    if [[ "$(docker inspect -f '{{.State.Running}}' "$candidate" 2>/dev/null || true)" == "true" ]]; then
      container="$candidate"
      break
    fi
  done
fi
if [[ -z "$container" ]]; then
  echo "ERROR: no hay contenedor MySQL en ejecución (cipse-prod-db-1 / cipse-db)." >&2
  echo "       Indique el contenedor: bash deploy/db-migrate.sh <contenedor>" >&2
  exit 1
fi
if [[ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)" != "true" ]]; then
  echo "ERROR: el contenedor '$container' no existe o no está en ejecución." >&2
  exit 1
fi

shopt -s nullglob
files=("$SQL_DIR"/[0-9][0-9][0-9]_*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "ERROR: no hay migraciones en $SQL_DIR" >&2
  exit 1
fi

echo "Contenedor MySQL: $container"
echo "Migraciones: ${#files[@]} archivos en db/sql/"
echo

for file in "${files[@]}"; do
  name="$(basename "$file")"
  printf '  %-42s ' "$name"
  if out="$(docker exec -i "$container" \
      sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" 2>&1' \
      < "$file" 2>&1)"; then
    echo "OK"
  else
    echo "ERROR"
    printf '%s\n' "$out" | grep -v 'Using a password' | sed 's/^/      /' >&2
    echo >&2
    echo "Detenido en $name. Corrija el error y vuelva a ejecutar el script." >&2
    exit 1
  fi
done

echo
echo "Esquema sincronizado. Tablas en la base:"
docker exec "$container" \
  sh -c 'mysql -N -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES" 2>/dev/null' \
  | sed 's/^/  - /'
