import type { Metadata } from "next";
import { headers } from "next/headers";
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

/*
 * El nonce se lee de headers() en este layout, así que todo el árbol se
 * renderiza dinámicamente y una navegación puede bloquear: se desactiva la
 * validación de navegación instantánea.
 */
export const instant = false;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El nonce lo genera el proxy por request. Leer headers() hace el render
  // dinámico (requisito del nonce) y Next aplica el nonce a sus scripts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="es"
      className={`${fontClassNames} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
