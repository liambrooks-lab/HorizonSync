import { Skeleton } from "@/shared/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="space-y-6">
      <div className="panel-elevated rounded-[28px] border border-[rgb(var(--border))] p-6 sm:p-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-5/6" />
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <div
          className="rounded-[30px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.88)] p-6"
          key={index}
        >
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-[20px]" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-56 w-full rounded-[24px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
