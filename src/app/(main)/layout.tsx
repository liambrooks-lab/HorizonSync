import { FloatingAssistant } from "@/modules/ai/components/FloatingAssistant";
import { AssistantProvider } from "@/modules/ai/hooks/useAssistant";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MasterNavigation } from "@/shared/components/MasterNavigation";
import { Button } from "@/shared/components/ui/button";
import { getSession } from "@/shared/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AssistantProvider>
      <div className="flex min-h-screen bg-transparent">
        <MasterNavigation />
        <div className="flex min-h-screen flex-1 flex-col px-4 py-4 md:px-6">
          <header className="flex items-center justify-between gap-4 rounded-[28px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.82)] px-6 py-4 backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
                Unified workspace
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[rgb(var(--foreground))]">
                HorizonSync
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                  {session.user.name ?? "HorizonSync User"}
                </p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">
                  {session.user.email ?? "No email available"}
                </p>
              </div>

              <Link href="/profile/settings">
                <Button variant="secondary">Profile settings</Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 py-6">{children}</main>
        </div>
        <FloatingAssistant />
      </div>
    </AssistantProvider>
  );
}
