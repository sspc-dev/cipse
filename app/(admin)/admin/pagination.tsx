import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

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

/**
 * Footer de paginación para listados del panel: resumen "N {noun} · página X
 * de Y" y navegación con enlaces de servidor (sin estado de cliente).
 */
export function PaginationFooter({
  page,
  totalPages,
  total,
  noun,
  pageHref,
  navLabel,
}: {
  page: number;
  totalPages: number;
  total: number;
  /** Sustantivo del listado, en plural: "registros", "cuentas". */
  noun: string;
  pageHref: (target: number) => string;
  navLabel: string;
}) {
  const pluralSuffix = total === 1 ? "" : "s";

  return (
    <>
      <p aria-label="Resumen de paginación" className="text-[11px] text-muted">
        {total} {noun}
        {pluralSuffix} · página {page} de {totalPages}
      </p>

      {totalPages > 1 ? (
        <nav
          aria-label={navLabel}
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

          <ul aria-label="Páginas disponibles" className="flex items-center gap-1">
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
  );
}
