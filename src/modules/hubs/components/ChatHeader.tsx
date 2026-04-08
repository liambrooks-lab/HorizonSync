import { Activity, Hash, MessageCircleMore, Mic, Video } from "lucide-react";

type ChatHeaderProps = {
  connectionState: "connected" | "connecting" | "unavailable";
  descriptor: {
    kind: "channel" | "direct";
    title: string;
    subtitle: string;
    icon: "text" | "audio" | "video" | "direct";
  };
  isTargetOnline: boolean;
  onlineCount: number;
};

function resolveIcon(icon: ChatHeaderProps["descriptor"]["icon"]) {
  switch (icon) {
    case "audio":
      return Mic;
    case "video":
      return Video;
    case "direct":
      return MessageCircleMore;
    default:
      return Hash;
  }
}

export function ChatHeader({
  connectionState,
  descriptor,
  isTargetOnline,
  onlineCount,
}: ChatHeaderProps) {
  const Icon = resolveIcon(descriptor.icon);
  const statusLabel =
    descriptor.kind === "direct"
      ? isTargetOnline
        ? "Online"
        : "Offline"
      : `${onlineCount} online`;

  return (
    <header className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--surface-elevated))] text-[rgb(var(--accent-strong))]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
            {descriptor.title}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
            {descriptor.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
        <Activity className="h-3.5 w-3.5" />
        {statusLabel}
        <span
          className={`h-2 w-2 rounded-full ${
            connectionState === "connected"
              ? "bg-emerald-400"
              : connectionState === "connecting"
                ? "bg-amber-400"
                : "bg-slate-400"
          }`}
        />
        {connectionState === "connected"
          ? "Realtime live"
          : connectionState === "connecting"
            ? "Connecting"
            : "Offline mode"}
      </div>
    </header>
  );
}
