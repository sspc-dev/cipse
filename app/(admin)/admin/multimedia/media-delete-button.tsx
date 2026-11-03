"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteEventMediaAction } from "@/lib/features/media/actions";

export function MediaDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function remove() {
    if (isPending) return;
    if (!window.confirm(`¿Eliminar “${title}” del almacenamiento?`)) return;

    setIsPending(true);
    const result = await deleteEventMediaAction(id);
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <button
      aria-label={`Eliminar ${title}`}
      className="rounded-full border border-danger/30 px-3 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
      disabled={isPending}
      onClick={() => void remove()}
      type="button"
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
