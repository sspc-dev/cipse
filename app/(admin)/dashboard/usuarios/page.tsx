import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { listAdminUsers } from "@/lib/features/users/datasource";
import { usersListQuerySchema } from "@/lib/features/users/schemas";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { UsersIcon } from "@/components/icons";
import { AdminShell } from "../admin-shell";
import { AdminHeader } from "../admin-header";
import { PaginationFooter } from "../pagination";
import { CreateUserForm } from "./create-user-form";
import { UserRow } from "./user-row";

export const metadata: Metadata = {
  title: "Usuarios del panel — CIPSE XV",
  description:
    "Administración de cuentas del personal acreditador del CIPSE XV.",
  robots: { index: false, follow: false },
};

/** Igual que el listado de acreditaciones. */
const PAGE_SIZE = 12;

const createdAtFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: CONGRESS_TIME_ZONE,
});

export default function AdminUsersPage(
  props: PageProps<"/admin/usuarios">,
) {
  return (
    <AdminShell>
      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent searchParams={props.searchParams} />
      </Suspense>
    </AdminShell>
  );
}

function UsersSkeleton() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 py-10 sm:px-8 lg:px-12 xl:px-14">
      <div className="mb-6 h-24 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="mb-4 h-40 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
    </div>
  );
}

async function UsersContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/usuarios">["searchParams"];
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const raw = await searchParams;
  const { p } = usersListQuerySchema.parse(raw);
  const { rows, total } = await listAdminUsers({ page: p, pageSize: PAGE_SIZE });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(p, totalPages);

  // Página fuera de rango (?p=99): reconsultar con la página válida para no
  // mostrar el estado vacío habiendo cuentas.
  const users =
    rows.length === 0 && p > totalPages
      ? (await listAdminUsers({ page, pageSize: PAGE_SIZE })).rows
      : rows;

  function pageHref(target: number): string {
    return target > 1 ? `/admin/usuarios?p=${target}` : "/admin/usuarios";
  }

  return (
    <>
      <AdminHeader admin={admin} active="usuarios" />

      <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 py-8 sm:px-8 lg:px-12 xl:px-14">
        <section className="mb-8 flex flex-col gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground">
              <UsersIcon className="size-5 text-tactical-bright" aria-hidden="true" />
              Usuarios del sistema
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
              Cuentas con acceso al panel de acreditación. Desactivar una
              cuenta invalida sus sesiones activas de inmediato.
            </p>
          </div>
          <CreateUserForm />
        </section>

        <section aria-label="Cuentas registradas" className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            <UsersIcon className="size-3.5" aria-hidden="true" />
            Cuentas registradas
            <span className="inline-flex items-center rounded-full border border-border/70 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold leading-none tracking-[0.12em] normal-case text-muted">
              {total}
            </span>
          </h2>

          {users.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-10 text-center dark:bg-white/[0.02]"
              role="status"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-foreground/5 text-muted">
                <UsersIcon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                Sin cuentas registradas
              </p>
              <p className="max-w-72 text-xs leading-relaxed text-muted">
                Cree la primera cuenta de acreditador con el formulario
                superior.
              </p>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    createdAtLabel={createdAtFormatter.format(user.createdAt)}
                    email={user.email}
                    id={user.id}
                    isActive={user.isActive}
                    isCurrentUser={user.id === admin.id}
                    name={user.name}
                  />
                ))}
              </ul>

              <PaginationFooter
                navLabel="Paginación de cuentas"
                noun="cuenta"
                page={page}
                pageHref={pageHref}
                totalPages={totalPages}
                total={total}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
