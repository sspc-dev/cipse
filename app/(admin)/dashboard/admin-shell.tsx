import type { ReactNode } from "react";

const gridOverlayClass =
  "absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-[linear-gradient(to_right,rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.5)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]";

/**
 * Contenedor visual común del panel: fondo ambiental institucional (torbellinos
 * tácticos, guinda y dorado con deriva lenta), cuadrícula técnica, viñeta y
 * franja de cierre. Las capas viven en un elemento fijo con aria-hidden para
 * no interferir con el contenido ni la tabulación.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background text-foreground dark:bg-[#070b11]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_0%,rgba(29,75,68,0.12),transparent_70%)] dark:bg-[radial-gradient(90%_55%_at_50%_0%,rgba(29,75,68,0.22),transparent_70%)]" />
        <div className="ambient-drift absolute -left-40 -top-40 size-[34rem] rounded-full bg-tactical/10 blur-[130px] dark:bg-tactical/25" />
        <div className="ambient-drift-slow absolute -right-44 top-1/3 size-[30rem] rounded-full bg-guinda/10 blur-[140px] dark:bg-guinda/20" />
        <div className="absolute -bottom-32 left-1/4 size-[26rem] rounded-full bg-gold/8 blur-[150px] dark:bg-gold/10" />
        <div className={gridOverlayClass} />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent dark:via-gold/50" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-background via-background/70 to-transparent dark:from-[#06090e] dark:via-[#06090e]/60" />
      </div>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 mt-10 border-t border-border/60 py-5 text-center text-[11px] text-muted/60">
        Gobierno de México · SSPC — CIPSE XV · Acreditación
      </footer>
    </main>
  );
}
