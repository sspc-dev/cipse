"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createAdminUser } from "@/lib/features/users/actions";
import { PlusIcon, XIcon } from "@/components/icons";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

export function CreateUserForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setError(null);

    const result = await createAdminUser({ name, email, password });
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(result.message);
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  const inputClass =
    "mt-1.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2";

  return (
    <form
      aria-label="Crear usuario acreditador"
      className="glass flex flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm dark:border-white/10"
      onSubmit={submit}
    >
      <div>
        <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-foreground">
          <PlusIcon className="size-4 text-tactical-bright" aria-hidden="true" />
          Nuevo acreditador
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Las cuentas creadas aquí pueden iniciar sesión en el panel y firmar
          asistencias.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TextField isRequired name="name" onChange={setName} value={name}>
          <Label className={labelClass}>Nombre</Label>
          <Input
            aria-required
            autoComplete="name"
            className={inputClass}
            placeholder="Nombre completo"
          />
        </TextField>

        <TextField
          isRequired
          name="email"
          onChange={setEmail}
          value={email}
        >
          <Label className={labelClass}>Correo institucional</Label>
          <Input
            aria-required
            autoComplete="email"
            className={inputClass}
            placeholder="acreditador@gob.mx"
            type="email"
          />
        </TextField>

        <TextField
          isRequired
          name="password"
          onChange={setPassword}
          value={password}
        >
          <Label className={labelClass}>Contraseña inicial</Label>
          <Input
            aria-required
            autoComplete="new-password"
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
            type="password"
          />
        </TextField>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="flex items-center gap-2 text-xs font-medium text-danger"
          role="alert"
        >
          <XIcon className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          className="h-10 rounded-full px-5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
          isDisabled={
            isPending ||
            name.trim().length < 2 ||
            email.trim().length === 0 ||
            password.length < 8
          }
          isPending={isPending}
          type="submit"
          variant="primary"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Crear usuario
        </Button>
      </div>
    </form>
  );
}
