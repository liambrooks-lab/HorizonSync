import { Skeleton } from "@/shared/components/ui/skeleton";

export default function HubChannelLoading() {
  return (
    <div className="p-3 sm:p-4">
      <div className="overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.88)] p-4">
        <div className="flex items-center justify-between gap-4 border-b border-[rgb(var(--border))] pb-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        <div className="space-y-4 py-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="flex gap-3" key={index}>
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-28 w-full rounded-[26px]" />
      </div>
    </div>
  );
}
