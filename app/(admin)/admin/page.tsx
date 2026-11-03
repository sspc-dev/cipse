import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  getStats,
  getAttendanceByDay,
  getRegistrationsByCountry,
  listAccreditations,
  type AccreditationListRow,
  type AccreditationStats,
  type AttendanceByDay,
  type AttendanceFilterKind,
  type RegistrationsByCountry,
} from "@/lib/features/admin/datasource";
import { adminListQuerySchema } from "@/lib/features/admin/schemas";
import {
  countryDisplayName,
  countryFlag,
} from "@/lib/features/register/data/countries";
import { folioLabel } from "@/lib/features/register/credential";
import { isoDayInCongressTime } from "@/lib/features/admin/dates";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FingerprintIcon,
  GlobeIcon,
  IdCardIcon,
  MedalIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  ShieldIcon,
  XIcon,
} from "@/components/icons";
import { AdminShell } from "./admin-shell";
import { AdminKeyGate } from "./admin-key-gate";
import { AdminHeader } from "./admin-header";
import { RowCheckinButton } from "./row-checkin-button";
import { RowQrDownloadButton } from "./row-qr-download-button";
import { RefreshButton } from "./refresh-button";
import { ScannerPanel } from "./scanner-panel";

export const metadata: Metadata = {
  title: "Panel de acreditación — CIPSE XV",
  description:
    "Panel interno del personal acreditador del CIPSE XV: credenciales emitidas, escaneo de asistencia y estadísticas.",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

const sectionTitleLabelClass =
  "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

function SectionTitle({
  icon,
  children,
}: {
  icon: React.JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <h2 className={sectionTitleLabelClass}>
      {icon}
      {children}
    </h2>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

function KpiSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-21.5 animate-pulse rounded-2xl bg-foreground/5"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-foreground/5" />
    </div>
  );
}

function StatsSkeleton() {
  return <KpiSkeleton />;
}

const kpiDelayClasses = [
  "",
  "[animation-delay:70ms]",
  "[animation-delay:140ms]",
  "[animation-delay:210ms]",
] as const;

const statCardClass =
  "reveal glass flex flex-col gap-1 rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10";

const dayLabelFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  timeZone: CONGRESS_TIME_ZONE,
});

type PanelFilters = {
  search?: string;
  country?: string;
  attendance?: AttendanceFilterKind;
};

/** URL del listado de acreditaciones con los filtros indicados. */
function listHref(filters: PanelFilters & { page?: number }): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.country) params.set("country", filters.country);
  if (filters.attendance) params.set("attendance", filters.attendance);
  if (filters.page && filters.page > 1) params.set("p", String(filters.page));
  const queryString = params.toString();
  return queryString ? `/admin?${queryString}` : "/admin";
}

function AttendanceByDayPanel({ days }: { days: AttendanceByDay[] }) {
  const max = Math.max(1, ...days.map((entry) => entry.count));
  const todayIso = isoDayInCongressTime(new Date());
  const periodTotal = days.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:150ms]">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <CalendarIcon className="size-3.5 text-muted/80" aria-hidden="true" />
        Asistencia por día · últimos {days.length} días
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {days.map((entry) => {
          const isToday = entry.day === todayIso;

          return (
            <li key={entry.day} className="flex items-center gap-2 text-[11px]">
              <span
                className={`w-20 shrink-0 ${isToday ? "font-semibold text-foreground" : "text-muted"}`}
              >
                {dayLabelFormatter.format(new Date(`${entry.day}T12:00:00Z`))}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/6"
                aria-hidden="true"
              >
                <div
                  className={`h-full rounded-full ${
                    isToday
                      ? "bg-linear-to-r from-tactical to-tactical-bright"
                      : "bg-accent/45"
                  }`}
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </div>
              <span
                className={`flex w-8 items-center justify-end gap-1 text-right font-mono tabular-nums ${isToday ? "font-semibold text-gold-ink" : ""}`}
                aria-label={`${entry.count} asistencias el ${entry.day}`}
              >
                {isToday ? (
                  <span
                    className="size-1.5 rounded-full bg-gold"
                    aria-hidden="true"
                    title="Hoy"
                  />
                ) : null}
                {entry.count}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 border-t border-border/60 pt-2 text-[10px] text-muted/80">
        Total del periodo: <span className="font-mono font-semibold tabular-nums text-muted">{periodTotal}</span> asistencias
      </p>
    </div>
  );
}

/** KPI 2×2 del bloque A: tarjeta fija, tarjetas de estado clicables. */
async function QuickStatsPanel({
  search,
  country,
  attendance,
}: PanelFilters) {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-3">
      <KpiSection
        stats={stats}
        search={search}
        country={country}
        attendance={attendance}
      />
      <p className="reveal px-1 text-[10px] leading-relaxed text-muted/80 [animation-delay:300ms]">
        Las estadísticas se actualizan al registrar una asistencia.
      </p>
    </div>
  );
}

const COUNTRY_ROW_CLASS =
  "group/row flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[11px] transition-colors hover:bg-foreground/[0.04]";

/**
 * Distribución de registros por país con lectura doble: la barra muestra el
 * total y el segmento acentuado los delegados con asistencia. Cada fila
 * filtra el listado por el país almacenado (códigos ISO y nombres legacy).
 */
function CountryDistributionPanel({
  countries,
  activeCountry,
  search,
  activeAttendance,
}: {
  countries: RegistrationsByCountry[];
  activeCountry?: string;
  search?: string;
  activeAttendance?: PanelFilters["attendance"];
}) {
  if (countries.length === 0) {
    return null;
  }

  const grandTotal = countries.reduce(
    (sum, entry) => sum + entry.total,
    0,
  );
  const limit = 6;
  const top = countries.slice(0, limit);
  const restSum = countries
    .slice(limit)
    .reduce((sum, entry) => sum + entry.total, 0);
  const max = Math.max(1, ...top.map((entry) => entry.total));

  function countryHref(value: string): string {
    return listHref({ search, attendance: activeAttendance, country: value });
  }

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:200ms]">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        <GlobeIcon className="size-3.5 text-muted/80" aria-hidden="true" />
        Distribución por país · {countries.length} país
        {countries.length === 1 ? "" : "es"}
      </p>

      <ul className="mt-3 flex flex-col gap-1">
        {top.map((entry) => {
          const isActive = entry.country === activeCountry;
          const label = countryDisplayName(entry.country, "es");
          const flag = countryFlag(entry.country);
          const share = Math.round((entry.total / grandTotal) * 100);

          return (
            <li key={entry.country}>
              <Link
                aria-current={isActive ? "true" : undefined}
                className={`${COUNTRY_ROW_CLASS} ${
                  isActive
                    ? "border border-gold/40 bg-gold/10"
                    : "border border-transparent"
                }`}
                href={countryHref(entry.country)}
                title={`Filtrar acreditaciones de ${label}`}
              >
                <span
                  aria-hidden="true"
                  className="w-5 shrink-0 text-center text-sm"
                >
                  {flag ?? ""}
                </span>
                <span
                  className={`w-28 shrink-0 truncate ${isActive ? "font-semibold text-foreground" : "text-foreground/90"}`}
                >
                  {label}
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/6"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-accent/45"
                    style={{ width: `${(entry.total / max) * 100}%` }}
                  />
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-accent"
                    style={{ width: `${(entry.attended / max) * 100}%` }}
                  />
                </span>
                <span
                  className="w-14 shrink-0 text-right font-mono tabular-nums"
                  aria-label={`${entry.total} registros, ${entry.attended} con asistencia`}
                >
                  {entry.total}
                  <span className="text-muted/70">
                    {" "}
                    · {share}%
                  </span>
                </span>
              </Link>
            </li>
          );
        })}

        {restSum > 0 ? (
          <li className={`${COUNTRY_ROW_CLASS} text-muted`}>
            <span className="w-5 shrink-0" />
            <span className="w-28 shrink-0 truncate">
              Otros ({countries.length - limit} país
              {countries.length - limit === 1 ? "" : "es"})
            </span>
            <span
              aria-hidden="true"
              className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/6"
            >
              <span
                className="block h-full rounded-full bg-accent/25"
                style={{ width: `${(restSum / max) * 100}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right font-mono tabular-nums">
              {restSum}
            </span>
          </li>
        ) : null}
      </ul>

      <p className="mt-2.5 flex items-center gap-2 border-t border-border/60 pt-2 text-[10px] leading-relaxed text-muted/80">
        <span
          aria-hidden="true"
          className="relative h-2 w-16 shrink-0 overflow-hidden rounded-full bg-accent/45"
        >
          <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-accent" />
        </span>
        Barra: total del país · Tramo sólido: con asistencia
      </p>
    </div>
  );
}

async function KpiSection({
  stats,
  search,
  country,
  attendance: activeAttendance,
}: {
  stats: AccreditationStats;
} & PanelFilters) {
  const kpiBadgeClass =
    "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-foreground/5";

  const total = Math.max(1, stats.total);
  const attendShare = Math.round((stats.checkedInToday / total) * 100);

  type KpiCard = {
    value: string;
    label: string;
    icon: React.JSX.Element;
    chip?: string;
    href?: string;
    active?: boolean;
    ariaLabel?: string;
  };

  const cards: KpiCard[] = [
    {
      value: stats.total.toLocaleString("es-MX"),
      label: "Registrados",
      icon: <IdCardIcon className="size-4 text-muted" />,
      chip: `+${stats.newLast7Days.toLocaleString("es-MX")} en 7 días`,
    },
    {
      value: stats.checkedInToday.toLocaleString("es-MX"),
      label: "Asistentes hoy",
      icon: <CheckIcon className="size-4 text-accent" />,
      chip: `${attendShare}% de registrados`,
      href: listHref({ search, country, attendance: "today" }),
      active: activeAttendance === "today",
      ariaLabel: "Filtrar el listado por delegados con asistencia hoy",
    },
    {
      value: stats.withoutAttendance.toLocaleString("es-MX"),
      label: "Sin asistencia",
      icon: <MedalIcon className="size-4 text-gold-ink" />,
      chip:
        stats.total > 0
          ? `${Math.round((stats.withoutAttendance / total) * 100)}% del total`
          : undefined,
      href: listHref({ search, country, attendance: "never" }),
      active: activeAttendance === "never",
      ariaLabel: "Filtrar el listado por delegados sin asistencia",
    },
    {
      value: stats.newLast7Days.toLocaleString("es-MX"),
      label: "Nuevos de la semana",
      icon: <PlusIcon className="size-4 text-tactical-bright" />,
    },
  ];

  const activeRingClass =
    "border-gold/50 ring-1 ring-gold/40 dark:border-gold/40";
  const hoverLiftClass =
    "transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:border-accent/60";

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => {
        const cardClass = `${statCardClass} ${kpiDelayClasses[index]} ${
          card.active ? activeRingClass : card.href ? hoverLiftClass : ""
        }`;

        const inner = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {card.value}
              </span>
              <span className={kpiBadgeClass} aria-hidden="true">
                {card.icon}
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {card.label}
            </span>
            {card.chip ? (
              <span className="text-[10px] font-semibold tracking-wide text-accent-soft-foreground">
                {card.chip}
              </span>
            ) : null}
          </>
        );

        return card.href ? (
          <Link
            aria-current={card.active ? "true" : undefined}
            aria-label={card.ariaLabel}
            className={cardClass}
            href={card.href}
            key={card.label}
            title={card.ariaLabel}
          >
            {inner}
          </Link>
        ) : (
          <div className={cardClass} key={card.label} title={card.label}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-foreground/5"
        />
      ))}
    </div>
  );
}

function RegistrationListItem({
  registration,
}: {
  registration: AccreditationListRow;
}) {
  const folio = folioLabel(registration.id);

  const credentialActionClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground";

  return (
    <li className="reveal glass-soft flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-3.5 transition-colors hover:border-accent/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-gold-ink">
            {folio}
          </span>
          {registration.attendanceDays > 0 ? (
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft-foreground">
              {registration.attendanceDays} día
              {registration.attendanceDays === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm font-semibold text-foreground">
          {registration.name} {registration.lastname}
        </p>
        <p className="truncate text-xs text-muted">
          {countryDisplayName(registration.country, "es")} ·{" "}
          {registration.email}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <p className="text-[11px] leading-relaxed text-muted">
          {registration.attendedToday
            ? `Registrado hoy a las ${dateTimeFormatter.format(registration.lastAttendanceAt ?? registration.createdAt)}`
            : `Solicitó el ${dateTimeFormatter.format(registration.createdAt)}`}
        </p>
        <div className="flex items-center gap-2">
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
          <RowCheckinButton
            accessCode={registration.accessCode}
            attendedToday={registration.attendedToday}
          />
        </div>
      </div>
    </li>
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

async function RegistrationsList({
  query,
  hasFilters,
}: {
  query: {
    page: number;
    pageSize: number;
    search?: string;
    country?: string;
    attendance?: AttendanceFilterKind;
  };
  hasFilters: boolean;
}) {
  const { rows, total } = await listAccreditations({
    page: query.page,
    pageSize: PAGE_SIZE,
    search: query.search,
    country: query.country,
    attendance: query.attendance,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  function pageHref(target: number): string {
    return listHref({
      search: query.search,
      country: query.country,
      attendance: query.attendance,
      page: target,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <div
          className="reveal flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-10 text-center dark:bg-white/[0.02]"
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
              : "Las solicitudes de los delegados aparecerán aquí automáticamente."}
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
          <ul className="flex flex-col gap-2">
            {rows.map((registration) => (
              <RegistrationListItem
                key={registration.id}
                registration={registration}
              />
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

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent searchParams={props.searchParams} />
      </Suspense>
    </AdminShell>
  );
}

function AdminSkeleton() {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 h-16 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="mb-8 h-72 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
    </div>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  const admin = await getAdminSession();
  const raw = await searchParams;
  const parsed = adminListQuerySchema.safeParse(raw).data ?? {
    p: 1,
    q: undefined,
    country: undefined,
    attendance: undefined,
  };

  if (!admin) {
    const loginGridOverlayClass =
      "absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(90%_75%_at_50%_45%,black,transparent)]";

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <Image
          fill
          priority
          alt=""
          aria-hidden="true"
          className="ken-burns object-cover object-center"
          sizes="100vw"
          src="/imgs/bg-register.jpeg"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/5 to-black/60 backdrop-blur-[2px] dark:from-[#070b11]/95 dark:via-[#070b11]/80 dark:to-[#06090e]/65" />

        <div className={loginGridOverlayClass} />
        <div className="reveal absolute inset-x-4 top-10 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-gold/25 bg-white/20 px-3 py-2 backdrop-blur-3xl shadow [animation-delay:150ms] sm:inset-x-8">
          <Image
            src="/imgs/SSPC_logo.png"
            alt="Logo de la Secretaría de Seguridad y Protección Ciudadana"
            priority
            width={200}
            height={200}
            className="h-12 w-auto"
          />
          <Image
            src="/imgs/logo_gob_mx.png"
            alt="Logo del Gobierno de México"
            priority
            width={150}
            height={150}
            className="h-10 w-auto"
          />
        </div>
        <div className="ambient-drift absolute -top-24 -left-24 size-96 rounded-full bg-tactical/30 blur-[130px]" />
        <div className="ambient-drift-slow absolute -right-24 bottom-0 size-[28rem] rounded-full bg-guinda/25 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-px z-10 bg-linear-to-r from-transparent via-gold/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#06090e] via-[#06090e]/40 to-transparent" />

        <div className="relative z-10 w-full max-w-md">
          <div className="card-enter overflow-hidden rounded-[22px] border border-border bg-surface/85 shadow-[0_30px_80px_-30px_rgba(16,24,29,0.4)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)]">
            <div className="strip-shine relative h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

            <div className="p-6 sm:p-8">
              <div className="reveal flex items-center gap-3">
                <Image
                  src="/imgs/SSPC.png"
                  alt="Sello de la Secretaría de Seguridad y Protección Ciudadana"
                  width={120}
                  height={120}
                  className="h-11 w-auto"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-ink/90">
                    CIPSE XV · México 2026
                  </p>
                  <h1 className="mt-1 flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
                    <ShieldIcon className="size-4 text-tactical-bright" />
                    Panel de acreditación
                  </h1>
                  <p className="mt-1 text-xs text-muted">
                    Acceso restringido al personal acreditador.
                  </p>
                </div>
              </div>

              <div className="reveal my-6 h-px bg-border [animation-delay:120ms]" />

              <div className="reveal [animation-delay:200ms]">
                <AdminKeyGate />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const query = {
    page: parsed.p,
    pageSize: PAGE_SIZE,
    search: parsed.q,
    country: parsed.country,
    attendance: parsed.attendance,
  };
  const searchQuery = query.search ?? "";
  const activeCountry = query.country;
  const activeAttendance = query.attendance;
  const hasFilters = Boolean(searchQuery || activeCountry || activeAttendance);
  const LABELS_BY_ATTENDANCE = {
    today: "Asistentes hoy",
    never: "Sin asistencia",
  } as const;

  return (
    <>
      <AdminHeader admin={admin} active="acreditaciones" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
        {/* Bloque A: escáner + estadísticas rápidas */}
        <section
          aria-label="Escaneo de credenciales y estadísticas rápidas"
          className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_1fr]"
        >
          <div className="flex flex-col gap-3">
            <SectionTitle
              icon={<FingerprintIcon className="size-3.5" aria-hidden="true" />}
            >
              Escáner de credenciales
            </SectionTitle>
            <div className="card-enter glass rounded-2xl border border-border p-5 shadow-sm dark:border-white/10">
              <ScannerPanel />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SectionTitle
              icon={<IdCardIcon className="size-3.5" aria-hidden="true" />}
            >
              Estadísticas rápidas
            </SectionTitle>
            <Suspense fallback={<StatsSkeleton />}>
              <QuickStatsPanel
                search={searchQuery}
                country={activeCountry}
                attendance={activeAttendance}
              />
            </Suspense>
          </div>
        </section>

        {/* Bloque B: gráficas del congreso a todo el ancho */}
        <section
          aria-label="Estadísticas del congreso"
          className="mb-8 grid gap-4 lg:grid-cols-2"
        >
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-2xl bg-foreground/5" />
            }
          >
            <AttendancePanelSection />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-2xl bg-foreground/5" />
            }
          >
            <CountryPanelSection
              search={searchQuery}
              attendance={activeAttendance}
              country={activeCountry}
            />
          </Suspense>
        </section>

        {/* Bloque C: listado filtrable */}
        <section
          aria-label="Listado de registros"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle
              icon={<ShieldIcon className="size-3.5" aria-hidden="true" />}
            >
              Acreditaciones
            </SectionTitle>
            <RefreshButton />
          </div>

          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeCountry ? (
                <Link
                  aria-label={`Quitar filtro de país ${countryDisplayName(activeCountry, "es")}`}
                  className="reveal inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-ink transition-colors hover:border-gold/60"
                  href={listHref({
                    search: searchQuery,
                    attendance: activeAttendance,
                  })}
                >
                  <GlobeIcon className="size-3.5" aria-hidden="true" />
                  {countryFlag(activeCountry) ?? ""}
                  {countryDisplayName(activeCountry, "es")}
                  <XIcon className="size-3" aria-hidden="true" />
                </Link>
              ) : null}
              {activeAttendance ? (
                <Link
                  aria-label={`Quitar filtro de asistencia ${LABELS_BY_ATTENDANCE[activeAttendance]}`}
                  className="reveal inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent-soft-foreground transition-colors hover:border-accent/70"
                  href={listHref({
                    search: searchQuery,
                    country: activeCountry,
                  })}
                >
                  {LABELS_BY_ATTENDANCE[activeAttendance]}
                  <XIcon className="size-3" aria-hidden="true" />
                </Link>
              ) : null}
              <Link
                aria-label="Quitar todos los filtros: búsqueda, país y estado"
                className="reveal inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-danger/60 hover:text-danger"
                href="/admin"
              >
                <XIcon className="size-3" aria-hidden="true" />
                Limpiar filtros
              </Link>
            </div>
          ) : null}

          <form
            action="/admin"
            className="flex max-w-md items-center gap-2"
            method="get"
          >
            {activeCountry ? (
              <input name="country" type="hidden" value={activeCountry} />
            ) : null}
            {activeAttendance ? (
              <input name="attendance" type="hidden" value={activeAttendance} />
            ) : null}
            <div className="relative flex-1">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted/70"
              />
              <input
                aria-label="Buscar por nombre, apellido, correo o folio"
                className="h-10 w-full rounded-full border border-field-border bg-field-background pl-10 pr-9 text-sm text-field-foreground transition-colors placeholder:text-field-placeholder focus:border-field-border-hover"
                defaultValue={searchQuery}
                name="q"
                placeholder="Buscar delegado, correo o folio"
                type="search"
                autoComplete="off"
              />
              {searchQuery ? (
                <Link
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                  href={listHref({
                    country: activeCountry,
                    attendance: activeAttendance,
                  })}
                >
                  <XIcon className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            <button
              className="h-10 shrink-0 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              type="submit"
            >
              Buscar
            </button>
          </form>

          <Suspense fallback={<ListSkeleton />}>
            <RegistrationsList query={query} hasFilters={hasFilters} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function AttendancePanelSection() {
  const days = await getAttendanceByDay();

  return <AttendanceByDayPanel days={days} />;
}

async function CountryPanelSection({
  search,
  country: activeCountry,
  attendance: activeAttendance,
}: PanelFilters) {
  const countries = await getRegistrationsByCountry();

  if (countries.length === 0) {
    return null;
  }

  return (
    <CountryDistributionPanel
      activeCountry={activeCountry}
      countries={countries}
      search={search}
      activeAttendance={activeAttendance}
    />
  );
}
