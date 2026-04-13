import { redirect } from "next/navigation";

import { MySpaceWorkspaceShell } from "@/modules/myspace/components/MySpaceWorkspaceShell";
import { getMySpaceWorkspace } from "@/modules/myspace/lib/documents";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function MySpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const workspace = await getMySpaceWorkspace(currentUser.id);

  return (
    <MySpaceWorkspaceShell folders={workspace.folders}>
      {children}
    </MySpaceWorkspaceShell>
  );
}
