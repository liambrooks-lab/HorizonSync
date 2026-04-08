import { cn } from "@/shared/lib/utils";

type PlaceholderPanelProps = {
  title: string;
  description: string;
  className?: string;
};

export function PlaceholderPanel({
  title,
  description,
  className,
}: PlaceholderPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,rgba(var(--surface-elevated),0.95),rgba(var(--surface),0.92))] p-8 shadow-[0_30px_80px_-48px_rgba(12,24,68,0.7)]",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
        HorizonSync
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[rgb(var(--foreground))]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
        {description}
      </p>
    </section>
  );
}
