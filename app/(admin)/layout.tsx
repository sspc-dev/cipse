import type { Metadata } from "next";
import { ThemeSwitcher } from "@/app/theme-switcher";

export const metadata: Metadata = {
  title: "Panel de acreditación — CIPSE XV",
  description:
    "Panel interno del personal acreditador del CIPSE XV: credenciales emitidas, escaneo de asistencia y estadísticas.",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ThemeSwitcher />
    </>
  );
}
