"use client";

import { AdminLoginForm } from "@/lib/features/auth/components/admin-login-form";
import { useRouter } from "next/navigation";

export function AdminKeyGate() {
  const router = useRouter();

  return <AdminLoginForm onSuccess={() => router.refresh()} />;
}
