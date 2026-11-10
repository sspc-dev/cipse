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
import {
  CheckIcon,
  ClockIcon,
  KeyIcon,
  PencilIcon,
  ShieldIcon,
  XIcon,
} from "@/components/icons";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

const actionButtonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-soft-foreground focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-1 disabled:opacity-50";

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
  "border-guinda/30 bg-guinda/10 text-guinda",
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
    <li className="reveal glass flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-4 shadow-sm transition-colors hover:border-accent/50 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {/* Avatar */}
          <span
            aria-hidden="true"
            className={`flex size-13 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold tracking-tight ${
              AVATAR_TONES[id % AVATAR_TONES.length]
            }`}
          >
            {initials(name)}
          </span>

          {/* Info principal */}
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{name}</p>

              {/* Badge de estado */}
              <span
                className={
                  isActive
                    ? "inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft-foreground"
                    : "inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-danger"
                }
              >
                {isActive ? (
                  <CheckIcon className="size-3" aria-hidden="true" />
                ) : (
                  <XIcon className="size-3" aria-hidden="true" />
                )}
                {isActive ? "Activo" : "Inactivo"}
              </span>

              {/* Badge de usuario actual */}
              {isCurrentUser ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
                  <ShieldIcon className="size-3" aria-hidden="true" />
                  Su cuenta
                </span>
              ) : null}
            </div>

            <p className="truncate text-xs text-muted">{email}</p>

            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted/70">
              <ClockIcon className="size-3" aria-hidden="true" />
              Alta: {createdAtLabel}
            </p>
          </div>
        </div>

        {/* Acciones */}
        {mode === "idle" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-label={`Editar usuario ${name}`}
              className={actionButtonClass}
              onClick={() => {
                setMode("edit");
                setError(null);
              }}
              type="button"
            >
              <PencilIcon className="size-3.5" aria-hidden="true" />
              Editar
            </button>
            <button
              aria-label={`Cambiar contraseña de ${name}`}
              className={actionButtonClass}
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              type="button"
            >
              <KeyIcon className="size-3.5" aria-hidden="true" />
              Contraseña
            </button>
            <button
              aria-label={
                isActive
                  ? `Desactivar usuario ${name}`
                  : `Activar usuario ${name}`
              }
              className={
                isActive
                  ? `${actionButtonClass} hover:border-danger/60 hover:text-danger`
                  : `${actionButtonClass} hover:border-accent hover:text-accent-soft-foreground`
              }
              disabled={isPending || (isCurrentUser && isActive)}
              onClick={() => void toggleActive()}
              title={
                isCurrentUser && isActive
                  ? "No puede desactivar su propia cuenta"
                  : undefined
              }
              type="button"
            >
              {isActive ? (
                <>
                  <XIcon className="size-3.5" aria-hidden="true" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckIcon className="size-3.5" aria-hidden="true" />
                  Activar
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Modo edición */}
      {mode === "edit" ? (
        <form
          className="flex flex-col gap-3 border-t border-border/60 pt-3"
          onSubmit={saveDetails}
        >
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
                className="mt-1.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
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
                className="mt-1.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
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

      {/* Modo contraseña */}
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
              className="mt-1.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
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
        <p
          aria-live="assertive"
          className="flex items-center gap-2 text-xs font-medium text-danger"
          role="alert"
        >
          <XIcon className="size-3.5" aria-hidden="true" />
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
        className={`${actionButtonClass} hover:border-danger/60 hover:text-danger`}
        onClick={onCancel}
        type="button"
      >
        Cancelar
      </button>
      <Button
        className="h-9 rounded-full px-4 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2"
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
