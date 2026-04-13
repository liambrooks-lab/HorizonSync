import { NextResponse } from "next/server";

import { type FeedScope, getPaginatedFeedPosts } from "@/modules/global/lib/posts";
import { getSession } from "@/shared/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const scope = (searchParams.get("scope") ?? "all") as FeedScope;

  const feed = await getPaginatedFeedPosts(
    session.user.id,
    cursor,
    scope === "bookmarks" ? "bookmarks" : "all",
  );

  return NextResponse.json(feed);
}
