"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { FloatingAssistant } from "@/modules/ai/components/FloatingAssistant";
import { MasterNavigation } from "@/shared/components/MasterNavigation";
import { Drawer } from "@/shared/components/ui/drawer";
import { PageTransition } from "@/shared/components/ui/page-transition";
import { ThemeSwitcher } from "@/shared/components/ui/theme-switcher";
import { Button } from "@/shared/components/ui/button";
import { useScreenshotAlert } from "@/shared/hooks/useScreenshotAlert";

type MainShellProps = {
  children: ReactNode;
  userEmail: string | null | undefined;
  userName: string | null | undefined;
};

export function MainShell({
  children,
  userEmail,
  userName,
}: MainShellProps) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  useScreenshotAlert();

  return (
    <div className="flex min-h-screen bg-transparent">
      <MasterNavigation className="hidden lg:flex" />

      <Drawer
        description="Switch between your core HorizonSync workspaces."
        onClose={() => setIsMobileNavigationOpen(false)}
        open={isMobileNavigationOpen}
        title="Navigation"
      >
        <div className="p-4">
          <MasterNavigation onNavigate={() => setIsMobileNavigationOpen(false)} showLabels />
        </div>
      </Drawer>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
        <header className="panel-surface sticky top-3 z-30 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[rgb(var(--border))] px-4 py-4 backdrop-blur-xl sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              className="lg:hidden"
              onClick={() => setIsMobileNavigationOpen(true)}
              size="icon"
              variant="secondary"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
                Unified workspace
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[rgb(var(--foreground))] sm:text-2xl">
                HorizonSync
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <ThemeSwitcher />

            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                {userName ?? "HorizonSync User"}
              </p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                {userEmail ?? "No email available"}
              </p>
            </div>

            <Link href="/profile/settings">
              <Button variant="secondary">Profile settings</Button>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 py-5 sm:py-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <FloatingAssistant />
    </div>
  );
}
