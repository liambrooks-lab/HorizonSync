import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureThreadForMessage, getThreadById } from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";
import { assertSameOriginRequest } from "@/shared/lib/security";

const threadSchema = z.object({
  rootMessageId: z.string().cuid(),
});

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request origin." },
      { status: 403 },
    );
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = threadSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const threadId = await ensureThreadForMessage({
      rootMessageId: parsedBody.data.rootMessageId,
      userId: session.user.id,
    });
    const thread = await getThreadById(threadId, session.user.id);

    return NextResponse.json({ thread });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create the thread." },
      { status: 400 },
    );
  }
}
