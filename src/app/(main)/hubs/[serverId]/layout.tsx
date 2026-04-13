import { notFound, redirect } from "next/navigation";

import { HubsConversationShell } from "@/modules/hubs/components/HubsConversationShell";
import { getServerPresenceChannelName, getServerWorkspace } from "@/modules/hubs/lib/hubs";
import { getCurrentUser } from "@/shared/lib/auth";

type HubServerLayoutProps = {
  children: React.ReactNode;
  params: {
    serverId: string;
  };
};

export default async function HubServerLayout({
  children,
  params,
}: HubServerLayoutProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const workspace = await getServerWorkspace(params.serverId, currentUser.id);

  if (!workspace) {
    notFound();
  }

  return (
    <HubsConversationShell
      channels={workspace.server.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      }))}
      directMessageTargets={workspace.directMessageTargets.map((target) => ({
        image: target.image,
        memberId: target.memberId,
        name: target.name,
        role: target.role,
        routeId: target.routeId,
      }))}
      serverId={workspace.server.id}
      serverName={workspace.server.name}
      serverPresenceChannelName={getServerPresenceChannelName(workspace.server.id)}
    >
      {children}
    </HubsConversationShell>
  );
}
