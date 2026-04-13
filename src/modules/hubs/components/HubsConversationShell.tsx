"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { HubsChannelSidebar } from "@/modules/hubs/components/HubsChannelSidebar";
import { Drawer } from "@/shared/components/ui/drawer";
import { Button } from "@/shared/components/ui/button";

type HubsConversationShellProps = {
  channels: Array<{
    id: string;
    name: string;
    type: "TEXT" | "AUDIO" | "VIDEO";
  }>;
  children: ReactNode;
  directMessageTargets: Array<{
    routeId: string;
    memberId: string;
    name: string;
    image: string | null;
    role: string;
  }>;
  serverId: string;
  serverName: string;
  serverPresenceChannelName: string;
};

export function HubsConversationShell({
  channels,
  children,
  directMessageTargets,
  serverId,
  serverName,
  serverPresenceChannelName,
}: HubsConversationShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      <HubsChannelSidebar
        channels={channels}
        className="hidden lg:flex"
        directMessageTargets={directMessageTargets}
        serverId={serverId}
        serverName={serverName}
        serverPresenceChannelName={serverPresenceChannelName}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-4 lg:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
              Active hub
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--foreground))]">
              {serverName}
            </h2>
          </div>

          <Button onClick={() => setIsSidebarOpen(true)} size="icon" variant="secondary">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 p-3 sm:p-4">{children}</div>
      </div>

      <Drawer
        description={`Browse channels and direct messages inside ${serverName}.`}
        onClose={() => setIsSidebarOpen(false)}
        open={isSidebarOpen}
        title={serverName}
      >
        <HubsChannelSidebar
          channels={channels}
          className="w-full border-r-0"
          directMessageTargets={directMessageTargets}
          onNavigate={() => setIsSidebarOpen(false)}
          serverId={serverId}
          serverName={serverName}
          serverPresenceChannelName={serverPresenceChannelName}
        />
      </Drawer>
    </div>
  );
}
