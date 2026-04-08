"use client";

import { Hash, MessageCircleMore, Mic, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHubPresence } from "@/modules/hubs/hooks/useChatSocket";
import { cn } from "@/shared/lib/utils";

type HubsChannelSidebarProps = {
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
  channels: Array<{
    id: string;
    name: string;
    type: "TEXT" | "AUDIO" | "VIDEO";
  }>;
};

function ChannelTypeIcon({ type }: { type: "TEXT" | "AUDIO" | "VIDEO" }) {
  if (type === "AUDIO") {
    return <Mic className="h-4 w-4" />;
  }

  if (type === "VIDEO") {
    return <Video className="h-4 w-4" />;
  }

  return <Hash className="h-4 w-4" />;
}

export function HubsChannelSidebar({
  directMessageTargets,
  serverId,
  serverName,
  serverPresenceChannelName,
  channels,
}: HubsChannelSidebarProps) {
  const pathname = usePathname();
  const { onlineMemberIds } = useHubPresence(
    serverPresenceChannelName,
  );

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[rgb(var(--border))] bg-[rgba(var(--surface),0.75)] backdrop-blur-xl">
      <div className="border-b border-[rgb(var(--border))] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
          Active hub
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--foreground))]">
          {serverName}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Channels
          </p>
          <div className="mt-3 space-y-1">
            {channels.map((channel) => {
              const isActive = pathname === `/hubs/${serverId}/${channel.id}`;

              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200",
                    isActive
                      ? "bg-[rgb(var(--accent-strong))] text-white"
                      : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))] hover:text-[rgb(var(--foreground))]",
                  )}
                  href={`/hubs/${serverId}/${channel.id}`}
                  key={channel.id}
                >
                  <ChannelTypeIcon type={channel.type} />
                  <span>{channel.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Direct Messages
          </p>
          <div className="mt-3 space-y-1">
            {directMessageTargets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] px-4 py-4 text-sm text-[rgb(var(--muted-foreground))]">
                Invite teammates to this hub to start private conversations.
              </div>
            ) : (
              directMessageTargets.map((target) => {
                const isActive = pathname === `/hubs/${serverId}/${target.routeId}`;
                const isOnline = onlineMemberIds.includes(target.memberId);

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200",
                      isActive
                        ? "bg-[rgb(var(--accent-strong))] text-white"
                        : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))] hover:text-[rgb(var(--foreground))]",
                    )}
                    href={`/hubs/${serverId}/${target.routeId}`}
                    key={target.memberId}
                  >
                    {target.image ? (
                      <img
                        alt={target.name}
                        className="h-8 w-8 rounded-xl object-cover"
                        src={target.image}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--surface))] text-xs font-semibold">
                        {target.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <MessageCircleMore className="h-4 w-4 shrink-0" />
                        <span className="truncate">{target.name}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        isOnline ? "bg-emerald-400" : "bg-slate-400/60",
                      )}
                    />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
