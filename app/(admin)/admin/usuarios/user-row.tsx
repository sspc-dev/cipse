"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  resetAdminUserPasswordAction,
  setAdminUserActiveAction,
  updateAdminUserAction,
} from "@/lib/features/users/actions";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

const actionButtonClass =
  "rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground disabled:opacity-60";

type Mode = "idle" | "edit" | "password";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

/** Tono alterna por cuenta para distinguir filas por simple vistazo. */
const AVATAR_TONES = [
  "border-tactical/40 bg-tactical/15 text-accent-soft-foreground",
  "border-gold/35 bg-gold/10 text-gold-ink",
  "border-border bg-foreground/5 text-muted",
] as const;

export function UserRow({
  id,
  name,
  email,
  isActive,
  isCurrentUser,
  createdAtLabel,
}: {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  isCurrentUser: boolean;
  createdAtLabel: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPassword, setDraftPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeForms() {
    setMode("idle");
    setDraftName(name);
    setDraftEmail(email);
    setDraftPassword("");
    setError(null);
  }

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setError(null);
    const result = await updateAdminUserAction({
      id,
      name: draftName,
      email: draftEmail,
    });
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(result.message);
    closeForms();
    router.refresh();
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setIsPending(true);
    setError(null);
    const result = await resetAdminUserPasswordAction({
      id,
      password: draftPassword,
    });
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(result.message);
    closeForms();
  }

  async function toggleActive() {
    if (isPending) return;

    setIsPending(true);
    setError(null);
    const result = await setAdminUserActiveAction({ id, active: !isActive });
    setIsPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <li className="glass-soft flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-3.5 transition-colors hover:border-accent/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex size-11 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold tracking-tight ${
              AVATAR_TONES[id % AVATAR_TONES.length]
            }`}
          >
            {initials(name)}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {name}
              </p>
              <span
                className={
                  isActive
                    ? "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft-foreground"
                    : "inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-danger"
                }
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-current"
                />
                {isActive ? "Activo" : "Inactivo"}
              </span>
              {isCurrentUser ? (
                <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
                  Su cuenta
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted">{email}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted/70">
              Alta: {createdAtLabel}
            </p>
          </div>
        </div>

        {mode === "idle" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={actionButtonClass}
              onClick={() => {
                setMode("edit");
                setError(null);
              }}
              type="button"
            >
              Editar
            </button>
            <button
              className={actionButtonClass}
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              type="button"
            >
              Contraseña
            </button>
            <button
              className={actionButtonClass}
              disabled={isPending || (isCurrentUser && isActive)}
              onClick={() => void toggleActive()}
              title={
                isCurrentUser && isActive
                  ? "No puede desactivar su propia cuenta"
                  : undefined
              }
              type="button"
            >
              {isActive ? "Desactivar" : "Activar"}
            </button>
          </div>
        ) : null}
      </div>

      {mode === "edit" ? (
        <form className="flex flex-col gap-3 border-t border-border/60 pt-3" onSubmit={saveDetails}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              isRequired
              name={`name-${id}`}
              onChange={setDraftName}
              value={draftName}
            >
              <Label className={labelClass}>Nombre</Label>
              <Input
                aria-required
                className="mt-1.5 py-2.5 text-sm"
                placeholder="Nombre completo"
              />
            </TextField>
            <TextField
              isRequired
              name={`email-${id}`}
              onChange={setDraftEmail}
              value={draftEmail}
            >
              <Label className={labelClass}>Correo institucional</Label>
              <Input
                aria-required
                className="mt-1.5 py-2.5 text-sm"
                placeholder="acreditador@gob.mx"
                type="email"
              />
            </TextField>
          </div>
          <RowFormActions
            isPending={isPending}
            onCancel={closeForms}
            submitLabel="Guardar cambios"
          />
        </form>
      ) : null}

      {mode === "password" ? (
        <form
          className="flex flex-col gap-3 border-t border-border/60 pt-3"
          onSubmit={savePassword}
        >
          <TextField
            isRequired
            name={`password-${id}`}
            onChange={setDraftPassword}
            value={draftPassword}
          >
            <Label className={labelClass}>Nueva contraseña</Label>
            <Input
              aria-required
              autoComplete="new-password"
              className="mt-1.5 py-2.5 text-sm"
              placeholder="Mínimo 8 caracteres"
              type="password"
            />
          </TextField>
          <RowFormActions
            isPending={isPending}
            onCancel={closeForms}
            submitLabel="Restablecer contraseña"
          />
        </form>
      ) : null}

      {error ? (
        <p aria-live="assertive" className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function RowFormActions({
  isPending,
  onCancel,
  submitLabel,
}: {
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        className={actionButtonClass}
        onClick={onCancel}
        type="button"
      >
        Cancelar
      </button>
      <Button
        className="h-8 rounded-full px-3.5 text-[11px] font-semibold"
        isDisabled={isPending}
        isPending={isPending}
        type="submit"
        variant="primary"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
