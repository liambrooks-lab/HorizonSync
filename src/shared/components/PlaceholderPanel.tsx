import { BrandWordmark } from "@/shared/components/BrandIdentity";
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
      <BrandWordmark className="w-[150px] opacity-90" />
      <h2 className="mt-3 text-2xl font-semibold text-[rgb(var(--foreground))]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
        {description}
      </p>
    </section>
  );
}
