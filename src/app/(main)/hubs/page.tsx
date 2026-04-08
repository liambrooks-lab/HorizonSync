import { redirect } from "next/navigation";

import { getHubServersForUser } from "@/modules/hubs/lib/hubs";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function HubsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const servers = await getHubServersForUser(currentUser.id);
  const firstServer = servers[0];

  if (!firstServer) {
    return null;
  }

  if (firstServer.channels[0]) {
    redirect(`/hubs/${firstServer.id}/${firstServer.channels[0].id}`);
  }

  redirect(`/hubs/${firstServer.id}`);
}
