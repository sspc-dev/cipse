import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { ThemeSwitcher } from "@/app/theme-switcher";
import { fontClassNames } from "@/lib/fonts";
import "@/app/globals.css";

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
    <html
      lang="es"
      className={`${fontClassNames} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>
          {children}
          <ThemeSwitcher />
        </Providers>
      </body>
    </html>
  );
}
