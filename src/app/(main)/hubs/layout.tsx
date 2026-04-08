import { redirect } from "next/navigation";

import { HubsServerRail } from "@/modules/hubs/components/HubsServerRail";
import { getHubServersForUser } from "@/modules/hubs/lib/hubs";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function HubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const servers = await getHubServersForUser(currentUser.id);

  return (
    <div className="flex min-h-full overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.7)] shadow-[0_34px_120px_-64px_rgba(12,24,68,0.8)] backdrop-blur-xl">
      <HubsServerRail servers={servers} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
