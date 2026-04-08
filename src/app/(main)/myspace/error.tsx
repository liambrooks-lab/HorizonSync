"use client";

import { Button } from "@/shared/components/ui/button";

export default function MySpaceError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[480px] items-center justify-center p-8">
      <div className="max-w-lg rounded-[30px] border border-rose-400/30 bg-rose-500/10 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200">
          My Space error
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          We could not load this workspace
        </h2>
        <p className="mt-3 text-sm leading-6 text-rose-100/80">
          {error.message || "An unexpected issue interrupted the document workspace."}
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
