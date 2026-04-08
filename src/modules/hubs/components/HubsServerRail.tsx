"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

type HubsServerRailProps = {
  servers: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    channels: Array<{
      id: string;
    }>;
  }>;
};

export function HubsServerRail({
  servers,
}: HubsServerRailProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[88px] shrink-0 flex-col items-center gap-4 border-r border-[rgb(var(--border))] bg-[rgba(var(--surface),0.72)] px-3 py-4 backdrop-blur-xl">
      {servers.map((server) => {
        const href = server.channels[0]
          ? `/hubs/${server.id}/${server.channels[0].id}`
          : `/hubs/${server.id}`;
        const isActive =
          pathname === `/hubs/${server.id}` ||
          pathname.startsWith(`/hubs/${server.id}/`);

        return (
          <Link
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-[22px] border text-sm font-semibold transition duration-200",
              isActive
                ? "border-[rgb(var(--accent-strong))] bg-[rgb(var(--accent-strong))] text-white shadow-[0_18px_40px_-24px_rgba(67,112,255,0.9)]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--surface-elevated))]",
            )}
            href={href}
            key={server.id}
            title={server.name}
          >
            {server.imageUrl ? (
              <img
                alt={server.name}
                className="h-full w-full rounded-[20px] object-cover"
                src={server.imageUrl}
              />
            ) : (
              <span>{server.name.slice(0, 2).toUpperCase()}</span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
