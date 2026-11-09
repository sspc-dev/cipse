import Link from "next/link";
import {
  CalendarIcon,
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
import { isoDayInCongressTime } from "@/lib/features/admin/dates";
import { PaginationFooter } from "./pagination";
import { listHref } from "./list-href";

export { listHref };
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { RowCheckinButton } from "./row-checkin-button";
import { RowQrDownloadButton } from "./row-qr-download-button";

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
  /** Día actual del congreso (YYYY-MM-DD) para resaltar la asistencia de hoy. */
  todayIso: string;
};

/**
 * Ficha de participante: avatar de iniciales, folio, país, correo, estado de
 * asistencia y acciones de credencial / impresión / check-in manual.
 */
function RegistrationCard({ registration, todayIso }: RegistrationCardProps) {
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
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-relaxed text-muted/85">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon
              aria-hidden="true"
              className="size-3 text-muted/70"
            />
            {dayLabelFormatter.format(new Date(registration.createdAt))}
          </span>
          {registration.attendanceDates.length > 0 ? (
            <span className="inline-flex flex-wrap items-center gap-1">
              <ClockIcon
                aria-hidden="true"
                className="size-3 text-muted/70"
              />
              <span className="text-muted/70">Asistencia:</span>
              {registration.attendanceDates.map((iso) => {
                const isToday = iso === todayIso;
                const label = dayLabelFormatter.format(
                  new Date(`${iso}T12:00:00Z`),
                );

                return (
                  <span
                    className={
                      isToday
                        ? "inline-flex items-center rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-soft-foreground"
                        : "inline-flex items-center rounded-full border border-border bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted"
                    }
                    key={iso}
                    title={isToday ? `Asistencia de hoy · ${label}` : label}
                  >
                    {isToday ? "hoy" : label}
                  </span>
                );
              })}
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
  const todayIso = isoDayInCongressTime(new Date());

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
                <RegistrationCard
                  registration={registration}
                  todayIso={todayIso}
                />
              </li>
            ))}
          </ul>

          <PaginationFooter
            navLabel="Paginación de registros"
            noun="registro"
            page={page}
            pageHref={pageHref}
            totalPages={totalPages}
            total={total}
          />
        </>
      )}
    </div>
  );
}
