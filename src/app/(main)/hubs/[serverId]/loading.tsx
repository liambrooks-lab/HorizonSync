import { Skeleton } from "@/shared/components/ui/skeleton";

export default function HubServerLoading() {
  return (
    <div className="flex min-h-[640px]">
      <Skeleton className="hidden w-[300px] rounded-none lg:block" />
      <div className="flex-1 space-y-4 p-3 sm:p-4">
        <Skeleton className="h-16 w-full rounded-[24px] lg:hidden" />
        <Skeleton className="h-full min-h-[520px] w-full rounded-[30px]" />
      </div>
    </div>
  );
}
