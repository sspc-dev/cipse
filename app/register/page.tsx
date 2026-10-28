import type { Metadata } from "next";
import { MedalIcon, ShieldIcon } from "./icons";
import { RegisterForm } from "./register-form";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Registro de acreditación — CIPSE XV",
  description:
    "Solicite su acreditación para el CIPSE XV, Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026.",
};

export default function RegisterPage() {
  const newLocal =
    "absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px] mask-[radial-gradient(85%_75%_at_50%_40%,black,transparent)]";
  return (
    <main className="min-h-screen bg-[#06090e] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,#123c35_0%,#08110f_52%,#06090e_100%)]" />
          <Image
            src="/imgs/bg-register.jpeg"
            alt="Elementos de la SSPC en despliegue operativo"
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="absolute inset-0 object-cover object-center opacity-[0.45]"
            priority
          />
          <div className={newLocal} />
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-guinda/25 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-tactical-bright/25 blur-[130px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#06090e] via-[#06090e]/40 to-transparent" />

          <div className="relative z-10 mt-auto flex flex-col gap-6 pt-16">
            <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 backdrop-blur">
              <MedalIcon className="size-4 text-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                CIPSE XV · México 2026
              </span>
            </div>

            <p className="max-w-xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white xl:text-5xl">
              Congreso Internacional Policial Contra el Secuestro y la Extorsión
            </p>

            <div className="flex  justify-between items-center gap-3 rounded-xl border border-gold/25 bg-white/4 px-3 py-2 backdrop-blur">
              <Image
                src="/imgs/SSPC_logo.png"
                alt="Logo de la Secretaría de Seguridad y Protección Ciudadana"
                priority
                width={200}
                height={200}
              />
              <Image
                src="/imgs/logo_gob_mx.png"
                alt="Logo de la Secretaría de Seguridad y Protección Ciudadana"
                priority
                width={150}
                height={150}
              />
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-screen flex-col bg-[#070b11] lg:border-l lg:border-white/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(29,75,68,0.2),transparent_70%)]" />

          <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-xl">
              <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
                <div className="flex size-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
                  <ShieldIcon className="size-6 text-gold" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-bold tracking-tight text-white">
                    CIPSE XV · México 2026
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
                    Gobierno de México · SSPC
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1016]/85 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                <div className="h-1 w-full bg-linear-to-r from-tactical via-white to-guinda" />

                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-1">
                    <Image
                      src="/imgs/SSPC.png"
                      alt="Logo de la Secretaría de Seguridad y Protección Ciudadana"
                      width={120}
                      height={120}
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/90">
                        CIPSE · México 2026
                      </p>
                      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                        Registro de acceso
                      </h1>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        Complete sus datos para solicitar el acceso al congreso
                      </p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-white/10" />

                  <RegisterForm />
                </div>
              </div>
            </div>
          </div>

          <footer className="relative z-10 flex flex-col items-center justify-between gap-2 border-t border-white/5 px-5 py-5 text-[11px] text-muted/60 sm:flex-row sm:px-8 lg:px-12">
            <span className="inline-flex items-center gap-2">
              Gobierno de México · SSPC
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
