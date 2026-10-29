"use client";

import { EyeIcon, EyeOffIcon } from "@/app/register/icons";
import { loginAdmin } from "@/lib/features/auth/actions";
import { Button, Input, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";

export function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setError(null);
    const outcome = await loginAdmin({ email, password });
    setIsPending(false);

    if (!outcome.ok) {
      setError(outcome.message);
      return;
    }
    onSuccess();
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <TextField isRequired name="email" onChange={setEmail} value={email}>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
          Correo institucional
        </Label>
        <Input
          aria-required
          autoComplete="username"
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
        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
          Contraseña
        </Label>
        <InputGroup className="mt-1.5">
          <Input
            aria-required
            autoComplete="current-password"
            className="py-2.5 text-sm w-full"
            placeholder="Contraseña del acreditador"
            type={passwordVisible ? "text" : "password"}
          />
          <InputGroup.Suffix>
            <button
              aria-label={
                passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={passwordVisible}
              className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              {passwordVisible ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>

      <Button
        isDisabled={
          isPending || email.trim().length === 0 || password.length === 0
        }
        isPending={isPending}
        type="submit"
        variant="primary"
      >
        Iniciar sesión
      </Button>
      {error ? (
        <p
          aria-live="assertive"
          className="text-xs font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
