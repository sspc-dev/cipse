"use client";

import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "next-themes";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      position="top-center"
      richColors
      theme={resolvedTheme === "light" ? "light" : "dark"}
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /** Nonce CSP generado por el proxy; autoriza el script inline del tema. */
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
