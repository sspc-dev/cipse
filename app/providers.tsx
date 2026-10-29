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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
