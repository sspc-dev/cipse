"use client";

import { Button } from "@heroui/react";
import { useState, useSyncExternalStore } from "react";
import { RegisterForm } from "./register-form";
import {
  QrCredentialCard,
  type CredentialData,
} from "./register-success";

const STORAGE_KEY = "cipse:credential";

/*
 * next-themes pattern: el estado persistido en localStorage solo existe en el
 * cliente, así que el gate resuelve tras hidratación con useSyncExternalStore
 * en lugar de setState en un efecto.
 */
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

function isStoredCredential(value: unknown): value is CredentialData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate["id"] === "number" &&
    Number.isInteger(candidate["id"]) &&
    typeof candidate["name"] === "string" &&
    typeof candidate["lastname"] === "string" &&
    typeof candidate["accessCode"] === "string" &&
    candidate["accessCode"].length >= 16
  );
}

function readStoredCredential(): CredentialData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return isStoredCredential(parsed) ? parsed : null;
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function writeStoredCredential(credential: CredentialData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(credential));
  } catch (error) {
    console.warn("[credential-gate] No se pudo guardar la credencial:", error);
  }
}

export function CredentialGate() {
  const mounted = useMounted();
  const [credentialOverride, setCredentialOverride] =
    useState<CredentialData | null>(null);

  if (!mounted) {
    return null;
  }

  const credential = readStoredCredential() ?? credentialOverride;

  if (credential) {
    return (
      <div className="flex flex-col items-center gap-4">
        <QrCredentialCard credential={credential} />
        <Button
          aria-label="Registrar a otra persona desde este dispositivo"
          className="h-11 rounded-full text-sm font-semibold"
          onPress={() => {
            window.localStorage.removeItem(STORAGE_KEY);
            setCredentialOverride(null);
          }}
          variant="ghost"
        >
          Registrar otro delegado
        </Button>
      </div>
    );
  }

  return (
    <RegisterForm
      onSuccess={(fresh) => {
        writeStoredCredential(fresh);
        setCredentialOverride(fresh);
      }}
    />
  );
}
