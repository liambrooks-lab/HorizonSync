"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { HubsServerRail } from "@/modules/hubs/components/HubsServerRail";
import { Drawer } from "@/shared/components/ui/drawer";
import { Button } from "@/shared/components/ui/button";

type HubsWorkspaceShellProps = {
  children: ReactNode;
  servers: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    channels: Array<{
      id: string;
      type: "TEXT" | "AUDIO" | "VIDEO";
    }>;
  }>;
};

export function HubsWorkspaceShell({
  children,
  servers,
}: HubsWorkspaceShellProps) {
  const [isRailOpen, setIsRailOpen] = useState(false);

  return (
    <div className="panel-surface min-h-full overflow-hidden rounded-[30px] border border-[rgb(var(--border))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-4 md:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Hubs
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--foreground))]">
            Team communication
          </h2>
        </div>

        <Button onClick={() => setIsRailOpen(true)} size="icon" variant="secondary">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-[calc(100vh-12.5rem)]">
        <HubsServerRail className="hidden md:flex" servers={servers} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <Drawer
        description="Switch between your hub workspaces and voice or video areas."
        onClose={() => setIsRailOpen(false)}
        open={isRailOpen}
        title="Hub servers"
      >
        <div className="p-4">
          <HubsServerRail
            onNavigate={() => setIsRailOpen(false)}
            servers={servers}
            showLabels
          />
        </div>
      </Drawer>
    </div>
  );
}
