import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  getStats,
  getAttendanceByDay,
  getRegistrationsByCountry,
  getRegistrationsByDay,
  type AccreditationStats,
  type AttendanceFilterKind,
} from "@/lib/features/admin/datasource";
import {
  adminListQuerySchema,
  normalizeChartPeriod,
} from "@/lib/features/admin/schemas";
import {
  countryDisplayName,
  countryFlag,
} from "@/lib/features/register/data/countries";
import { congressTodayIso } from "@/lib/congress-dates";
import {
  CheckIcon,
  FingerprintIcon,
  GlobeIcon,
  IdCardIcon,
  MedalIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  TrendIcon,
  XIcon,
} from "@/components/icons";
import { AdminShell } from "./admin-shell";
import { AdminKeyGate } from "./admin-key-gate";
import { AdminHeader } from "./admin-header";
import { RefreshButton } from "./refresh-button";
import { ScannerPanel } from "./scanner-panel";
import {
  ListSkeleton,
  RegistrationsList,
  listHref,
} from "./registrations-list";
import { TrendChartPanel } from "./charts/trend-chart";
import { AttendanceChartPanel } from "./charts/attendance-chart";
import { CountryChartPanel } from "./charts/country-chart";
import { AttendanceFilter } from "./charts/attendance-filter";

export const metadata: Metadata = {
  title: "Panel de acreditación — CIPSE XV",
  description:
    "Panel interno del personal acreditador del CIPSE XV: credenciales emitidas, escaneo de asistencia y estadísticas.",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 12;

/** Contenedor fluido del panel: usa el ancho disponible con tope en pantallas ultraanchas. */
const PAGE_CONTAINER_CLASS =
  "relative z-10 mx-auto w-full max-w-[1760px] px-5 py-8 sm:px-8 lg:px-12 xl:px-14";

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

function KpiSkeleton() {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-21.5 animate-pulse rounded-2xl bg-foreground/5"
        />
      ))}
    </div>
  );
}

const kpiDelayClasses = [
  "",
  "[animation-delay:70ms]",
  "[animation-delay:140ms]",
  "[animation-delay:210ms]",
] as const;

const statCardClass =
  "reveal glass flex flex-col gap-1 rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10";

type PanelFilters = {
  search?: string;
  country?: string;
  attendance?: AttendanceFilterKind;
  period?: number;
};

/** Franja de KPIs a todo el ancho: tarjeta fija, tarjetas de estado clicables. */
async function QuickStatsPanel({
  search,
  country,
  attendance,
  period,
}: PanelFilters) {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-3">
      <KpiSection
        stats={stats}
        search={search}
        country={country}
        attendance={attendance}
        period={period}
      />
      <p className="reveal px-1 text-[10px] leading-relaxed text-muted/80 [animation-delay:300ms]">
        Las estadísticas se actualizan al registrar una asistencia.
      </p>
    </div>
  );
}

async function KpiSection({
  stats,
  search,
  country,
  attendance: activeAttendance,
  period,
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
      href: listHref({ search, country, attendance: "today", period }),
      active: activeAttendance === "today",
      ariaLabel: "Filtrar el listado por participantes con asistencia hoy",
    },
    {
      value: stats.withoutAttendance.toLocaleString("es-MX"),
      label: "Sin asistencia",
      icon: <MedalIcon className="size-4 text-gold-ink" />,
      chip:
        stats.total > 0
          ? `${Math.round((stats.withoutAttendance / total) * 100)}% del total`
          : undefined,
      href: listHref({ search, country, attendance: "never", period }),
      active: activeAttendance === "never",
      ariaLabel: "Filtrar el listado por participantes sin asistencia",
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

export default function AdminPage(props: PageProps<"/dashboard">) {
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
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="mb-6 h-16 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="mb-6 h-21.5 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="h-96 animate-pulse rounded-2xl bg-foreground/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-foreground/5" />
      </div>
    </div>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const admin = await getAdminSession();
  const raw = await searchParams;
  const parsed = adminListQuerySchema.safeParse(raw).data ?? {
    p: 1,
    q: undefined,
    country: undefined,
    attendance: undefined,
    period: 14,
  };
  const period = normalizeChartPeriod(parsed.period);

  if (!admin) {
    const loginGridOverlayClass =
      "absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(90%_75%_at_50%_45%,black,transparent)]";

    return (
      <main className="relative flex min-h-dvh items-center justify-center px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -inset-3">
            <Image
              fill
              priority
              alt=""
              className="ken-burns object-cover object-center"
              sizes="100vw"
              src="/imgs/bg-register.jpeg"
            />
          </div>

          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/5 to-black/60 backdrop-blur-[2px] dark:from-[#070b11]/95 dark:via-[#070b11]/80 dark:to-[#06090e]/65" />

          <div className={loginGridOverlayClass} />
          <div className="ambient-drift absolute -top-24 -left-24 size-96 rounded-full bg-tactical/30 blur-[130px]" />
          <div className="ambient-drift-slow absolute -right-24 bottom-0 size-112 rounded-full bg-guinda/25 blur-[140px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#06090e] via-[#06090e]/40 to-transparent" />
        </div>

        <div className="reveal absolute inset-x-4 top-10 z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border border-gold/25 bg-white/20 px-3 py-2 backdrop-blur-3xl shadow [animation-delay:150ms] sm:inset-x-8">
          <Image
            src="/imgs/SSPC_logo.png"
            alt="Logo de la Secretaría de Seguridad y Protección Ciudadana"
            priority
            width={200}
            height={200}
            className="w-28 md:w-58"
          />
          <Image
            src="/imgs/logo_gob_mx.png"
            alt="Logo del Gobierno de México"
            priority
            width={150}
            height={150}
            className="w-20 md:w-38"
          />
        </div>

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

  return (
    <>
      <AdminHeader admin={admin} active="acreditaciones" />

      <div className={PAGE_CONTAINER_CLASS}>
        {/* Franja de KPIs a todo el ancho */}
        <section aria-label="Estadísticas rápidas" className="mb-6">
          <Suspense fallback={<KpiSkeleton />}>
            <QuickStatsPanel
              search={searchQuery}
              country={activeCountry}
              attendance={activeAttendance}
              period={period}
            />
          </Suspense>
        </section>

        {/* Escáner + tendencia de registros */}
        <section
          aria-label="Escaneo de credenciales y tendencia de registros"
          className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]"
        >
          <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
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
              icon={<TrendIcon className="size-3.5" aria-hidden="true" />}
            >
              Tendencia de registros
            </SectionTitle>
            <Suspense
              fallback={
                <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
              }
            >
              <TrendPanelSection period={period} />
            </Suspense>
          </div>
        </section>

        {/* Gráficas del congreso */}
        <section
          aria-label="Estadísticas del congreso"
          className="mb-6 grid gap-4 lg:grid-cols-2"
        >
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-2xl bg-foreground/5" />
            }
          >
            <AttendancePanelSection period={period} />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-2xl bg-foreground/5" />
            }
          >
            <CountryPanelSection
              search={searchQuery}
              attendance={activeAttendance}
              country={activeCountry}
              period={period}
            />
          </Suspense>
        </section>

        {/* Listado filtrable */}
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

          {/* Barra de herramientas: búsqueda + filtro de asistencia + chips */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-foreground/[0.02] p-3 dark:border-white/10 sm:flex-row sm:items-center sm:gap-4">
            <form
              action="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-2"
              method="get"
            >
              {activeCountry ? (
                <input name="country" type="hidden" value={activeCountry} />
              ) : null}
              {activeAttendance ? (
                <input
                  name="attendance"
                  type="hidden"
                  value={activeAttendance}
                />
              ) : null}
              <input name="period" type="hidden" value={String(period)} />
              <div className="relative min-w-0 flex-1">
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted/70"
                />
                <input
                  aria-label="Buscar por nombre, apellido, correo o folio"
                  className="h-10 w-full rounded-full border border-field-border bg-field-background pl-10 pr-9 text-sm text-field-foreground transition-colors placeholder:text-field-placeholder focus:border-field-border-hover"
                  defaultValue={searchQuery}
                  name="q"
                  placeholder="Buscar participante, correo o folio"
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
                      period,
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

            <AttendanceFilter active={activeAttendance} />

            {hasFilters ? (
              <div className="flex flex-wrap items-center gap-2">
                {activeCountry ? (
                  <Link
                    aria-label={`Quitar filtro de país ${countryDisplayName(activeCountry, "es")}`}
                    className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-ink transition-colors hover:border-gold/60"
                    href={listHref({
                      search: searchQuery,
                      attendance: activeAttendance,
                      period,
                    })}
                  >
                    <GlobeIcon className="size-3.5" aria-hidden="true" />
                    {countryFlag(activeCountry) ?? ""}
                    {countryDisplayName(activeCountry, "es")}
                    <XIcon className="size-3" aria-hidden="true" />
                  </Link>
                ) : null}
                <Link
                  aria-label="Quitar todos los filtros: búsqueda, país y estado"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-danger/60 hover:text-danger"
                  href={`/dashboard?period=${period}`}
                >
                  <XIcon className="size-3" aria-hidden="true" />
                  Limpiar
                </Link>
              </div>
            ) : null}
          </div>

          <Suspense fallback={<ListSkeleton />}>
            <RegistrationsList
              hasFilters={hasFilters}
              period={period}
              query={query}
            />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function TrendPanelSection({ period }: { period: number }) {
  const days = await getRegistrationsByDay(period);

  return <TrendChartPanel days={days} period={period} />;
}

async function AttendancePanelSection({ period }: { period: number }) {
  const days = await getAttendanceByDay(period);
  const todayIso = congressTodayIso();

  return <AttendanceChartPanel days={days} todayIso={todayIso} />;
}

async function CountryPanelSection({
  search,
  country: activeCountry,
  attendance: activeAttendance,
  period,
}: PanelFilters) {
  // Top 12 desde la BD: la gráfica muestra el top 8 y agrega el resto.
  const countries = await getRegistrationsByCountry(12);

  if (countries.length === 0) {
    return null;
  }

  return (
    <CountryChartPanel
      activeAttendance={activeAttendance}
      activeCountry={activeCountry}
      countries={countries}
      period={period}
      search={search}
    />
  );
}
