import { NextResponse } from "next/server";

import { getThreadById } from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";

type ThreadRouteContext = {
  params: {
    threadId: string;
  };
};

export async function GET(_request: Request, { params }: ThreadRouteContext) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await getThreadById(params.threadId, session.user.id);

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  return NextResponse.json({ thread });
}
