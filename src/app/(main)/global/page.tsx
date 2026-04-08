import { redirect } from "next/navigation";

import { FeedList } from "@/modules/global/components/FeedList";
import { getPaginatedFeedPosts } from "@/modules/global/lib/posts";
import { PlaceholderPanel } from "@/shared/components/PlaceholderPanel";
import { getCurrentUser } from "@/shared/lib/auth";

export default async function GlobalPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const feed = await getPaginatedFeedPosts(currentUser.id);

  return (
    <div className="space-y-6">
      <PlaceholderPanel
        description="This is the public-facing conversation layer of HorizonSync, blending broadcast communication, community signals, and quick collaboration entry points."
        title="Global feed"
      />
      <FeedList
        initialCursor={feed.nextCursor}
        initialPosts={feed.items}
        viewer={{
          id: currentUser.id,
          image: currentUser.image ?? null,
          name: currentUser.name ?? currentUser.email ?? "HorizonSync User",
          username: currentUser.username ?? null,
        }}
      />
    </div>
  );
}
