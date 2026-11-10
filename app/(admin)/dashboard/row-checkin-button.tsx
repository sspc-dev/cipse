"use client";

import { registerAttendance } from "@/lib/features/checkin/actions";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RowCheckinButton({
  accessCode,
  attendedToday,
}: {
  accessCode: string;
  attendedToday: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const doneToday = attendedToday || state === "done";

  if (doneToday && state !== "pending") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
        Registrado hoy
      </span>
    );
  }

  async function mark() {
    if (state === "pending") return;

    setState("pending");
    const outcome = await registerAttendance(accessCode);

    if (outcome.ok) {
      setState("done");
      setMessage(null);
      router.refresh();
      return;
    }

    setState("idle");
    if (outcome.code === "SESSION_REQUIRED") {
      setMessage("Sesión expirada. Recargue e inicie sesión.");
      return;
    }

    setMessage(outcome.message);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        className="h-9 rounded-full text-xs font-semibold"
        isDisabled={state === "pending"}
        isPending={state === "pending"}
        onPress={() => void mark()}
        variant="secondary"
      >
        Registrar asistencia
      </Button>
      {state !== "pending" && message ? (
        <p
          className="max-w-48 text-right text-[10px] leading-relaxed text-danger"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
