import { notFound, redirect } from "next/navigation";

import { getServerWorkspace } from "@/modules/hubs/lib/hubs";
import { getCurrentUser } from "@/shared/lib/auth";

type HubServerPageProps = {
  params: {
    serverId: string;
  };
};

export default async function HubServerPage({ params }: HubServerPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const workspace = await getServerWorkspace(params.serverId, currentUser.id);

  if (!workspace) {
    notFound();
  }

  const firstChannel = workspace.server.channels[0];
  const firstDirectMessage = workspace.directMessageTargets[0];

  if (firstChannel) {
    redirect(`/hubs/${params.serverId}/${firstChannel.id}`);
  }

  if (firstDirectMessage) {
    redirect(`/hubs/${params.serverId}/${firstDirectMessage.routeId}`);
  }

  notFound();
}
