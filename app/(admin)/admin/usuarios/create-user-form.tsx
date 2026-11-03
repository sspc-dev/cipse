"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createAdminUser } from "@/lib/features/users/actions";

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

  return (
    <form
      aria-label="Crear usuario acreditador"
      className="glass flex flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm dark:border-white/10"
      onSubmit={submit}
    >
      <div>
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          Nuevo acreditador
        </h2>
        <p className="mt-1 text-xs text-muted">
          Las cuentas creadas aquí pueden iniciar sesión en el panel y firmar
          asistencias.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <TextField isRequired name="name" onChange={setName} value={name}>
          <Label className={labelClass}>Nombre</Label>
          <Input
            aria-required
            autoComplete="name"
            className="mt-1.5 py-2.5 text-sm"
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
            className="mt-1.5 py-2.5 text-sm"
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
            className="mt-1.5 py-2.5 text-sm"
            placeholder="Mínimo 8 caracteres"
            type="password"
          />
        </TextField>
      </div>

      {error ? (
        <p aria-live="assertive" className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          className="rounded-full text-sm font-semibold"
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
          Crear usuario
        </Button>
      </div>
    </form>
  );
}
