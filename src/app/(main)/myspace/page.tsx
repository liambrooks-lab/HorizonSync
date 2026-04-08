import { redirect } from "next/navigation";

import { getMySpaceWorkspace } from "@/modules/myspace/lib/documents";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function MySpacePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const workspace = await getMySpaceWorkspace(currentUser.id);
  const firstDocument = workspace.folders.flatMap((folder) => folder.documents)[0];

  if (!firstDocument) {
    return null;
  }

  redirect(`/myspace/${firstDocument.id}`);
}
