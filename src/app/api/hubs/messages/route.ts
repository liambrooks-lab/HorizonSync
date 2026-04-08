import { NextResponse } from "next/server";
import { z } from "zod";

import { createHubMessage } from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";
import { isPusherConfigured, pusherServer } from "@/shared/lib/pusher";

const messageSchema = z.object({
  serverId: z.string().cuid(),
  routeId: z.string().min(1),
  content: z.string().max(4000).default(""),
  attachment: z
    .object({
      url: z.string().url(),
      name: z.string().max(255).nullable().optional(),
      type: z.string().max(255).nullable().optional(),
      size: z.number().int().nonnegative().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = messageSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const result = await createHubMessage({
      content: parsedBody.data.content,
      routeId: parsedBody.data.routeId,
      serverId: parsedBody.data.serverId,
      userId: session.user.id,
      fileName: parsedBody.data.attachment?.name ?? null,
      fileSize: parsedBody.data.attachment?.size ?? null,
      fileType: parsedBody.data.attachment?.type ?? null,
      fileUrl: parsedBody.data.attachment?.url ?? null,
    });

    if (isPusherConfigured && pusherServer) {
      await pusherServer.trigger(result.realtimeChannelName, "message:new", {
        message: result.message,
      });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while sending the message.",
      },
      { status: 400 },
    );
  }
}
