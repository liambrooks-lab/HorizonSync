import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/modules/profile/components/ProfileSettingsForm";
import { PlaceholderPanel } from "@/shared/components/PlaceholderPanel";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function ProfileSettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PlaceholderPanel
        description="Fine-tune your HorizonSync identity across the unified workspace. This phase focuses on the core profile attributes needed by auth and the shell."
        title="Profile settings"
      />

      <ProfileSettingsForm
        initialValues={{
          image: currentUser.image ?? "",
          name: currentUser.name ?? "",
          bio: currentUser.bio ?? "",
          region: currentUser.region ?? "",
          socialLinks: currentUser.socialLinks,
          email: currentUser.email ?? "",
        }}
      />
    </div>
  );
}
