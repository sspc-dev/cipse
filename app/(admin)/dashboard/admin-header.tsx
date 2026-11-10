import Image from "next/image";
import Link from "next/link";
import { ThemeSwitcher } from "@/app/theme-switcher";
import { AdminLogoutButton } from "./admin-logout-button";
import {
  IdCardIcon,
  ImageIcon,
  QrCodeIcon,
  ShieldIcon,
  UsersIcon,
  type IconProps,
} from "@/components/icons";

export type AdminSection = "acreditaciones" | "usuarios" | "multimedia";

const NAV_ITEMS: {
  section: AdminSection;
  label: string;
  href: string;
  icon: (props: IconProps) => React.JSX.Element;
}[] = [
  {
    section: "acreditaciones",
    label: "Acreditaciones",
    href: "/dashboard",
    icon: IdCardIcon,
  },
  {
    section: "usuarios",
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: UsersIcon,
  },
  {
    section: "multimedia",
    label: "Multimedia",
    href: "/dashboard/multimedia",
    icon: ImageIcon,
  },
];

export function AdminHeader({
  admin,
  active,
}: {
  admin: { name: string };
  active: AdminSection;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 px-5 py-4 backdrop-blur-md dark:bg-[#070b11]/70 sm:px-8 lg:px-12 xl:px-14">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/imgs/SSPC.png"
              alt="Sello de la Secretaría de Seguridad y Protección Ciudadana"
              width={120}
              height={120}
              className="h-10 w-auto"
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
          <div className="flex items-center gap-2">
            <Link
              aria-label="Abrir el QR imprimible para el autorregistro"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground sm:inline-flex"
              href="/dashboard/register-qr"
            >
              <QrCodeIcon aria-hidden="true" className="size-3.5" />
              QR de registro
            </Link>
            <Link
              aria-label="Ir a la galería pública del congreso"
              className="hidden rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground sm:inline-flex"
              href="/es/multimedia"
            >
              Galería pública
            </Link>
            <span className="hidden text-[11px] text-muted md:inline">
              {admin.name}
            </span>
            <ThemeSwitcher variant="inline" />
            <AdminLogoutButton />
          </div>
        </div>

        <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.section === active;
            const Icon = item.icon;

            return (
              <Link
                key={item.section}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-semibold text-accent-foreground"
                    : "inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-soft-foreground"
                }
                href={item.href}
              >
                <Icon
                  aria-hidden="true"
                  className={
                    isActive ? "size-3.5" : "size-3.5 text-muted/70"
                  }
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
