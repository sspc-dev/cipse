import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/features/auth/actions";
import { listAdminUsers } from "@/lib/features/users/datasource";
import { CONGRESS_TIME_ZONE } from "@/lib/constants";
import { AdminHeader } from "../admin-header";
import { CreateUserForm } from "./create-user-form";
import { UserRow } from "./user-row";

export const metadata: Metadata = {
  title: "Usuarios del panel — CIPSE XV",
  description:
    "Administración de cuentas del personal acreditador del CIPSE XV.",
  robots: { index: false, follow: false },
};

const createdAtFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: CONGRESS_TIME_ZONE,
});

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_50%_at_50%_0%,rgba(29,75,68,0.2),transparent_70%)]" />
        <Suspense fallback={<UsersSkeleton />}>
          <UsersContent />
        </Suspense>
      </div>
    </main>
  );
}

function UsersSkeleton() {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 h-24 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="mb-6 h-40 animate-pulse rounded-2xl bg-foreground/5" />
      <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
    </div>
  );
}

async function UsersContent() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin");
  }

  const users = await listAdminUsers();

  return (
    <>
      <AdminHeader admin={admin} active="usuarios" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
        <section className="mb-8 flex flex-col gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Usuarios del sistema
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              Cuentas con acceso al panel de acreditación. Desactivar una
              cuenta invalida sus sesiones activas de inmediato.
            </p>
          </div>
          <CreateUserForm />
        </section>

        <section aria-label="Cuentas registradas" className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Cuentas registradas · {users.length}
          </h2>

          {users.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-8 text-center"
              role="status"
            >
              <p className="text-sm font-semibold text-foreground">
                Sin cuentas registradas
              </p>
              <p className="max-w-64 text-xs leading-relaxed text-muted">
                Cree la primera cuenta de acreditador con el formulario
                superior.
              </p>
            </div>
          ) : (
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
          )}
        </section>

        <footer className="mt-10 border-t border-border/60 pt-5 text-center text-[11px] text-muted/60">
          Gobierno de México · SSPC — CIPSE XV · Acreditación
        </footer>
      </div>
    </>
  );
}
