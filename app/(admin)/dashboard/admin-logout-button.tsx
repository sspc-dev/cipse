"use client";

import { logoutAdmin } from "@/lib/features/auth/actions";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "@/components/icons";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    if (isPending) return;
    setIsPending(true);
    await logoutAdmin();
    router.refresh();
  }

  return (
    <Button
      aria-label="Cerrar sesión de acreditación"
      className="h-9 rounded-full text-xs font-semibold"
      isPending={isPending}
      onPress={() => void logout()}
      variant="ghost"
    >
      <LogOutIcon className="size-3.5" aria-hidden="true" />
      Salir
    </Button>
  );
}
