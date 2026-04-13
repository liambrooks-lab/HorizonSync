"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { ToastProvider } from "@/shared/components/ui/toast";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      disableTransitionOnChange
      enableSystem={false}
      themes={["dark", "light"]}
    >
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
