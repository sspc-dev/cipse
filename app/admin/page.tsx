import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  getStats,
  getAttendanceByDay,
  listAccreditations,
  type AccreditationListRow,
  type AttendanceByDay,
} from "@/lib/features/admin/datasource";
import { adminListQuerySchema } from "@/lib/features/admin/schemas";
import { labelStatus } from "@/lib/features/checkin/status";
import { folioLabel } from "@/lib/features/register/credential";
import { isoDayInCongressTime } from "@/lib/features/admin/dates";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  FingerprintIcon,
  IdCardIcon,
  MedalIcon,
  PrinterIcon,
  ShieldIcon,
} from "@/app/register/icons";
import { AdminKeyGate } from "./admin-key-gate";
import { AdminLogoutButton } from "./admin-logout-button";
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

function AttendanceByDayPanel({ days }: { days: AttendanceByDay[] }) {
  const max = Math.max(1, ...days.map((entry) => entry.count));
  const todayIso = isoDayInCongressTime(new Date());

  return (
    <div className="reveal glass rounded-2xl border border-border px-4 py-3.5 shadow-sm dark:border-white/10 [animation-delay:150ms]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
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
                  className={`h-full rounded-full ${isToday ? "bg-accent" : "bg-accent/45"}`}
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </div>
              <span
                className="w-6 text-right font-mono tabular-nums"
                aria-label={`${entry.count} asistencias el ${entry.day}`}
              >
                {entry.count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

async function StatsPanels() {
  const [stats, byDay] = await Promise.all([getStats(), getAttendanceByDay()]);

  return (
    <div className="flex flex-col gap-3">
      <KpiSection stats={stats} />
      <AttendanceByDayPanel days={byDay} />
      <p className="reveal px-1 text-[10px] leading-relaxed text-muted/80 [animation-delay:300ms]">
        El listado y las estadísticas se actualizan al registrar una asistencia.
      </p>
    </div>
  );
}

async function KpiSection({
  stats,
}: {
  stats: Awaited<ReturnType<typeof getStats>>;
}) {
  const cards: { value: number; label: string; icon: React.JSX.Element }[] = [
    {
      value: stats.total,
      label: "Registrados",
      icon: <IdCardIcon className="size-4 text-muted" />,
    },
    {
      value: stats.approved,
      label: "Aprobados",
      icon: <CheckIcon className="size-4 text-accent" />,
    },
    {
      value: stats.pending,
      label: "Pendientes",
      icon: <MedalIcon className="size-4 text-gold-ink" />,
    },
    {
      value: stats.checkedInToday,
      label: "Asistentes hoy",
      icon: <ClockIcon className="size-4 text-tactical-bright" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          title={card.label}
          className={`${statCardClass} ${kpiDelayClasses[index]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              {card.value.toLocaleString("es-MX")}
            </span>
            {card.icon}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {card.label}
          </span>
        </div>
      ))}
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

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={
        status === "Aprobada"
          ? "inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft-foreground"
          : status === "Rechazada"
            ? "inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-danger"
            : "inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink"
      }
    >
      {status}
    </span>
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
          <StatusChip status={labelStatus(registration.status)} />
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
          {registration.country} · {registration.email}
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
  searchQuery,
}: {
  query: { page: number; pageSize: number; search?: string };
  searchQuery: string;
}) {
  const { rows, total } = await listAccreditations({
    page: query.page,
    pageSize: PAGE_SIZE,
    search: query.search,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (target > 1) params.set("p", String(target));
    const queryString = params.toString();
    return queryString ? `/admin?${queryString}` : "/admin";
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-8 text-center"
          role="status"
        >
          <AlertCircleIcon className="size-6 text-muted" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">
            {searchQuery ? "Sin resultados" : "Sin solicitudes aún"}
          </p>
          <p className="max-w-64 text-xs leading-relaxed text-muted">
            {searchQuery
              ? `No hay acreditaciones que coincidan con “${searchQuery}”.`
              : "Las solicitudes de los delegados aparecerán aquí automáticamente."}
          </p>
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
                  className="rounded-full border border-border px-3 py-1.5 font-semibold transition-colors hover:border-accent hover:text-accent-soft-foreground"
                  href={pageHref(page - 1)}
                >
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
                  className="rounded-full border border-border px-3 py-1.5 font-semibold transition-colors hover:border-accent hover:text-accent-soft-foreground"
                  href={pageHref(page + 1)}
                >
                  Siguiente
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
    <main className="min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_50%_at_50%_0%,rgba(29,75,68,0.2),transparent_70%)]" />

        <Suspense fallback={<AdminSkeleton />}>
          <AdminContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
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
  };

  if (!admin) {
    const loginGridOverlayClass =
      "absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]";

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
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
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-guinda/20 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-tactical-bright/20 blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />

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

          <footer className="reveal mt-6 text-center text-[11px] text-muted/60 [animation-delay:350ms]">
            Gobierno de México · SSPC — CIPSE XV · Acreditación
          </footer>
        </div>
      </div>
    );
  }

  const query = {
    page: parsed.p,
    pageSize: PAGE_SIZE,
    search: parsed.q,
  };
  const searchQuery = query.search ?? "";

  return (
    <>
      <header className="relative z-10 border-b border-border/60 px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
              <h1 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
                <ShieldIcon className="size-4 text-tactical-bright" />
                Panel de acreditación
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted sm:inline">
              {admin.name}
            </span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
        <section
          aria-label="Escaneo de credenciales"
          className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]"
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
              Estadísticas
            </SectionTitle>
            <Suspense fallback={<StatsSkeleton />}>
              <StatsPanels />
            </Suspense>
          </div>
        </section>

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

          <form
            action="/admin"
            className="flex max-w-md items-center gap-2"
            method="get"
          >
            <div className="relative flex-1">
              <input
                aria-label="Buscar por nombre, apellido, correo o folio"
                className="h-10 w-full rounded-full border border-field-border bg-field-background pl-4 pr-9 text-sm text-field-foreground placeholder:text-field-placeholder focus:border-field-border-hover"
                defaultValue={searchQuery}
                name="q"
                placeholder="Buscar delegado, correo o folio"
                type="search"
                autoComplete="off"
              />
              {searchQuery ? (
                <a
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted transition-colors hover:text-foreground"
                  href="/admin"
                >
                  ✕
                </a>
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
            <RegistrationsList query={query} searchQuery={searchQuery} />
          </Suspense>
        </section>

        <footer className="mt-10 border-t border-border/60 pt-5 text-center text-[11px] text-muted/60">
          Gobierno de México · SSPC — CIPSE XV · Acreditación
        </footer>
      </div>
    </>
  );
}
