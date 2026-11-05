import Link from "next/link";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FingerprintIcon,
  PrinterIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons";
import {
  countryDisplayName,
  countryFlag,
} from "@/lib/features/register/data/countries";
import { folioLabel } from "@/lib/features/register/credential";
import {
  listAccreditations,
  type AccreditationListRow,
  type AttendanceFilterKind,
} from "@/lib/features/admin/datasource";
import { listHref } from "./list-href";

export { listHref };
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { RowCheckinButton } from "./row-checkin-button";
import { RowQrDownloadButton } from "./row-qr-download-button";

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

const dayLabelFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

/** Tono de avatar derivado del nombre para distinguir fichas sin imágenes. */
const AVATAR_TONES = [
  "bg-tactical/25 text-accent-soft-foreground border-accent/40",
  "bg-gold/15 text-gold-ink border-gold/40",
  "bg-guinda/20 text-guinda border-guinda/40",
  "bg-foreground/8 text-foreground/80 border-border",
] as const;

function avatarTone(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsOf(name: string, lastname: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  const last = lastname.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

type RegistrationCardProps = {
  registration: AccreditationListRow;
};

/**
 * Ficha de participante: avatar de iniciales, folio, país, correo, estado de
 * asistencia y acciones de credencial / impresión / check-in manual.
 */
function RegistrationCard({ registration }: RegistrationCardProps) {
  const folio = folioLabel(registration.id);
  const label = `${registration.name} ${registration.lastname}`;
  const countryName = countryDisplayName(registration.country, "es");
  const flag = countryFlag(registration.country);
  const tone = avatarTone(registration.id + label);

  const statusBadge = registration.attendedToday ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-soft-foreground">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-accent-soft-foreground"
      />
      Asistió hoy
    </span>
  ) : registration.attendanceDays > 0 ? (
    <span className="inline-flex items-center rounded-full border border-border bg-foreground/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
      {registration.attendanceDays} día
      {registration.attendanceDays === 1 ? "" : "s"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-ink">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-gold"
      />
      Sin asistencia
    </span>
  );

  const credentialActionClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground focus-visible:outline-2 focus-visible:outline-gold/60";

  return (
    <article className="reveal glass flex h-full flex-col gap-3.5 rounded-2xl border border-border/70 p-4 shadow-sm transition-colors hover:border-accent/50 dark:border-white/10">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-full border font-display text-xs font-bold tracking-tight ${tone}`}
        >
          {initialsOf(registration.name, registration.lastname)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-gold-ink">
              {folio}
            </span>
            {statusBadge}
          </div>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {label}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
            <span aria-hidden="true" className="shrink-0">
              {flag ?? ""}
            </span>
            <span className="truncate">{countryName}</span>
          </p>
        </div>
      </header>

      <a
        className="block truncate text-xs text-muted/90 transition-colors hover:text-accent-soft-foreground"
        href={`mailto:${registration.email}`}
      >
        {registration.email}
      </a>

      <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-relaxed text-muted/85">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon
              aria-hidden="true"
              className="size-3 text-muted/70"
            />
            {dayLabelFormatter.format(new Date(registration.createdAt))}
          </span>
          {registration.attendanceDays > 0 && registration.lastAttendanceAt ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon
                aria-hidden="true"
                className="size-3 text-muted/70"
              />
              Última:{" "}
              {dateTimeFormatter.format(registration.lastAttendanceAt)}
            </span>
          ) : null}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <RowQrDownloadButton
            accessCode={registration.accessCode}
            className={credentialActionClass}
            id={registration.id}
            lastname={registration.lastname}
            name={registration.name}
          />
          <a
            aria-label={`Imprimir credencial de ${folio}`}
            className={credentialActionClass}
            href={`/admin/credential/${registration.id}`}
            rel="noreferrer"
            target="_blank"
          >
            <PrinterIcon className="size-3.5" aria-hidden="true" />
            Imprimir
          </a>
          <span className="ml-auto">
            <RowCheckinButton
              accessCode={registration.accessCode}
              attendedToday={registration.attendedToday}
            />
          </span>
        </div>
      </div>
    </article>
  );
}

type PaginationItem =
  | { isGap: true; label: "…" }
  | { isGap: false; label: string; page: number };

/**
 * Ventana deslizante de paginación: siempre muestra la primera, la última y
 * las páginas vecinas a la actual, con elipsis intermedias.
 */
function paginationWindow(page: number, totalPages: number): PaginationItem[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];
  let previous = 0;

  for (const current of sorted) {
    if (current - previous > 1) {
      items.push({ isGap: true, label: "…" });
    }
    items.push({ isGap: false, label: String(current), page: current });
    previous = current;
  }

  return items;
}

export function ListSkeleton() {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-2xl bg-foreground/5"
        />
      ))}
    </div>
  );
}

type RegistrationsListProps = {
  query: {
    page: number;
    pageSize: number;
    search?: string;
    country?: string;
    attendance?: AttendanceFilterKind;
  };
  hasFilters: boolean;
  /** Periodo de gráficas a preservar en los enlaces de paginación. */
  period?: number;
};

export async function RegistrationsList({
  query,
  hasFilters,
  period,
}: RegistrationsListProps) {
  const { rows, total } = await listAccreditations({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    country: query.country,
    attendance: query.attendance,
  });

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);

  function pageHref(target: number): string {
    return listHref({
      search: query.search,
      country: query.country,
      attendance: query.attendance,
      period,
      page: target,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <div
          className="reveal flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-12 text-center dark:bg-white/[0.02]"
          role="status"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-foreground/5 text-muted">
            {hasFilters ? (
              <SearchIcon className="size-5" aria-hidden="true" />
            ) : (
              <FingerprintIcon className="size-5" aria-hidden="true" />
            )}
          </span>
          <p className="text-sm font-semibold text-foreground">
            {hasFilters ? "Sin resultados" : "Sin solicitudes aún"}
          </p>
          <p className="max-w-72 text-xs leading-relaxed text-muted">
            {hasFilters
              ? "No hay acreditaciones que coincidan con los filtros activos."
              : "Las solicitudes de los participantes aparecerán aquí automáticamente."}
          </p>
          {hasFilters ? (
            <Link
              aria-label="Quitar todos los filtros del listado"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground"
              href="/admin"
            >
              <XIcon className="size-3" aria-hidden="true" />
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((registration) => (
              <li key={registration.id} className="h-full">
                <RegistrationCard registration={registration} />
              </li>
            ))}
          </ul>

          <p
            aria-label="Resumen de paginación"
            className="text-[11px] text-muted"
          >
            {total} registro{total === 1 ? "" : "s"} · página {page} de{" "}
            {totalPages}
          </p>

          {totalPages > 1 ? (
            <nav
              aria-label="Paginación de registros"
              className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted"
            >
              {page > 1 ? (
                <a
                  aria-label={`Página ${page - 1}`}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3.5 text-xs font-semibold transition-colors hover:border-accent hover:text-accent-soft-foreground"
                  href={pageHref(page - 1)}
                >
                  <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
                  Anterior
                </a>
              ) : (
                <span />
              )}

              <ul
                aria-label="Páginas disponibles"
                className="flex items-center gap-1"
              >
                {paginationWindow(page, totalPages).map((item) => (
                  <li key={item.label}>
                    {item.isGap ? (
                      <span className="px-1.5" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <a
                        aria-current={item.page === page ? "page" : undefined}
                        aria-label={`Ir a la página ${item.page}`}
                        href={pageHref(item.page ?? 0)}
                        className={
                          item.page === page
                            ? "flex size-7 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground"
                            : "flex size-7 items-center justify-center rounded-full border border-border font-semibold transition-colors hover:border-accent"
                        }
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>

              {page < totalPages ? (
                <a
                  aria-label={`Página ${page + 1}`}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3.5 text-xs font-semibold transition-colors hover:border-accent hover:text-accent-soft-foreground"
                  href={pageHref(page + 1)}
                >
                  Siguiente
                  <ChevronRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
