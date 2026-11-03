import Image from "next/image";
import Link from "next/link";
import { AdminLogoutButton } from "./admin-logout-button";
import { ShieldIcon } from "@/components/icons";

export type AdminSection = "acreditaciones" | "usuarios" | "multimedia";

const NAV_ITEMS: { section: AdminSection; label: string; href: string }[] = [
  { section: "acreditaciones", label: "Acreditaciones", href: "/admin" },
  { section: "usuarios", label: "Usuarios", href: "/admin/usuarios" },
  { section: "multimedia", label: "Multimedia", href: "/admin/multimedia" },
];

export function AdminHeader({
  admin,
  active,
}: {
  admin: { name: string };
  active: AdminSection;
}) {
  return (
    <header className="relative z-10 border-b border-border/60 px-5 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
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

        <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.section === active;

            return (
              <Link
                key={item.section}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-semibold text-accent-foreground"
                    : "rounded-full border border-border px-3.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground"
                }
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
