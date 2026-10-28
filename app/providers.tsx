"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        closeButton
        position="top-center"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: "#0b1016",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#f4f6f7",
          },
        }}
      />
    </>
  );
}
