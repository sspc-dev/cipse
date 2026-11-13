"use client";

import { LogOutIcon } from "@/components/icons";
import { logoutMediaAccreditation } from "@/lib/features/auth/media-actions";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaLogoutButton({
  label,
  ariaLabel,
}: {
  label: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    if (isPending) return;
    setIsPending(true);
    await logoutMediaAccreditation();
    router.refresh();
  }

  return (
    <Button
      aria-label={ariaLabel}
      className="h-8 rounded-full px-3 text-[11px] font-semibold"
      isPending={isPending}
      onPress={() => void logout()}
      variant="ghost"
    >
      <LogOutIcon className="size-3.5" aria-hidden="true" />
      {label}
    </Button>
  );
}
