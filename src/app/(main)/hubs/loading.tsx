import { Skeleton } from "@/shared/components/ui/skeleton";

export default function HubsLoading() {
  return (
    <div className="panel-surface min-h-[640px] overflow-hidden rounded-[30px] border border-[rgb(var(--border))]">
      <div className="flex min-h-[640px]">
        <Skeleton className="hidden w-[88px] rounded-none md:block" />
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-full rounded-[24px] md:hidden" />
          <Skeleton className="h-full min-h-[520px] w-full rounded-[30px]" />
        </div>
      </div>
    </div>
  );
}
