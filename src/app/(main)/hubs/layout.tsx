import { redirect } from "next/navigation";

import { HubsWorkspaceShell } from "@/modules/hubs/components/HubsWorkspaceShell";
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
    <HubsWorkspaceShell servers={servers}>{children}</HubsWorkspaceShell>
  );
}
