import { FloatingAssistant } from "@/modules/ai/components/FloatingAssistant";
import { AssistantProvider } from "@/modules/ai/hooks/useAssistant";
import { redirect } from "next/navigation";

import { MainShell } from "@/shared/components/MainShell";
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
      <MainShell userEmail={session.user.email} userName={session.user.name}>
        {children}
      </MainShell>
    </AssistantProvider>
  );
}
