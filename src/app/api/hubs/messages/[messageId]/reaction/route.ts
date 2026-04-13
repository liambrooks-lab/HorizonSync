import { NextResponse } from "next/server";
import { z } from "zod";

import { toggleMessageReaction } from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";
import { assertSameOriginRequest } from "@/shared/lib/security";

const reactionSchema = z.object({
  emoji: z.string().min(1).max(16),
});

type MessageReactionRouteContext = {
  params: {
    messageId: string;
  };
};

export async function POST(request: Request, { params }: MessageReactionRouteContext) {
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

  const parsedBody = reactionSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const message = await toggleMessageReaction({
      emoji: parsedBody.data.emoji,
      messageId: params.messageId,
      userId: session.user.id,
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to react to the message." },
      { status: 400 },
    );
  }
}
