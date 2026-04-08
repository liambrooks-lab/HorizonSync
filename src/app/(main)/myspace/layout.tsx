import { redirect } from "next/navigation";

import { MySpaceSidebar } from "@/modules/myspace/components/MySpaceSidebar";
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
    <div className="flex min-h-full overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.74)] shadow-[0_34px_120px_-64px_rgba(12,24,68,0.8)] backdrop-blur-xl">
      <MySpaceSidebar folders={workspace.folders} />
      <div className="min-w-0 flex-1 p-4">{children}</div>
    </div>
  );
}
