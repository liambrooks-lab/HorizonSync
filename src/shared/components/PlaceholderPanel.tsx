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
        "panel-elevated rounded-[28px] border border-[rgb(var(--border))] p-6 sm:p-8",
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
