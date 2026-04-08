import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[rgb(var(--foreground))]">
          This horizon does not exist
        </h1>
        <p className="mt-4 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
          The page you requested could not be found. Jump back into the main workspace shell.
        </p>
        <div className="mt-8">
          <Link href="/global">
            <Button>Go to Global</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
