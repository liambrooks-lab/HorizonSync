import { notFound, redirect } from "next/navigation";

import { ChatWindow } from "@/modules/hubs/components/ChatWindow";
import { getHubThreadData } from "@/modules/hubs/lib/hubs";
import { getCurrentUser } from "@/shared/lib/auth";

type HubChannelPageProps = {
  params: {
    serverId: string;
    channelId: string;
  };
};

export default async function HubChannelPage({ params }: HubChannelPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const thread = await getHubThreadData(
    params.serverId,
    params.channelId,
    currentUser.id,
  );

  if (!thread) {
    notFound();
  }

  return (
    <ChatWindow
      currentMember={{
        id: thread.workspace.currentMember.id,
        name: thread.workspace.currentMember.name,
      }}
      descriptor={thread.descriptor}
      initialMessages={thread.messages}
      serverId={params.serverId}
      serverPresenceChannelName={thread.serverPresenceChannelName}
    />
  );
}
