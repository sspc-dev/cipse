import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { fontClassNames } from "@/lib/fonts";
import "@/app/globals.css";

/*
 * Layout raíz único para todo el sitio: mantiene un solo `ThemeProvider`
 * montado entre navegaciones. Con `cacheComponents` (React Activity), los
 * layouts por segmento pueden quedar ocultos y reactivarse; un proveedor por
 * layout reaparecía con un tema obsoleto y "reiniciaba" la selección al
 * cambiar de idioma. Un único proveedor arriba de los segmentos cacheados
 * elimina ese escritor duplicado.
 */
export const metadata: Metadata = {
  title: "CIPSE XV — Congreso Internacional Policial",
  description:
    "Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026. Organizado por la SSPC.",
};

export default function RootLayout({
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
