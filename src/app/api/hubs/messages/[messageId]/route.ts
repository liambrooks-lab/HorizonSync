import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteHubMessage,
  getMessageThreadChannelName,
  getSerializedHubMessageById,
  updateHubMessage,
} from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";
import { assertSameOriginRequest } from "@/shared/lib/security";
import { isPusherConfigured, pusherServer } from "@/shared/lib/pusher";

const updateSchema = z.object({
  content: z.string().min(1).max(4000),
});

type MessageRouteContext = {
  params: {
    messageId: string;
  };
};

async function broadcastUpdate(messageId: string, userId: string) {
  if (!isPusherConfigured || !pusherServer) {
    return;
  }

  const message = await getSerializedHubMessageById(messageId, userId);

  if (!message) {
    return;
  }

  const channels = await Promise.all([
    import("@/shared/lib/db").then(({ db }) =>
      db.message.findUnique({
        where: { id: messageId },
        select: {
          threadId: true,
          channelId: true,
          channel: {
            select: {
              serverId: true,
            },
          },
          directMessageConversation: {
            select: {
              serverId: true,
              memberOneId: true,
              memberTwoId: true,
            },
          },
        },
      }),
    ),
  ]);

  const source = channels[0];

  if (!source) {
    return;
  }

  if (source.threadId) {
    await pusherServer.trigger(getMessageThreadChannelName(source.threadId), "message:update", {
      message,
    });
    return;
  }

  if (source.channelId && source.channel?.serverId) {
    const { getThreadChannelName } = await import("@/modules/hubs/lib/hubs");
    await pusherServer.trigger(
      getThreadChannelName({
        kind: "channel",
        channelId: source.channelId,
        serverId: source.channel.serverId,
      }),
      "message:update",
      { message },
    );
  }

  if (source.directMessageConversation?.serverId) {
    const { getThreadChannelName } = await import("@/modules/hubs/lib/hubs");
    await pusherServer.trigger(
      getThreadChannelName({
        kind: "direct",
        memberIds: [
          source.directMessageConversation.memberOneId,
          source.directMessageConversation.memberTwoId,
        ],
        serverId: source.directMessageConversation.serverId,
      }),
      "message:update",
      { message },
    );
  }
}

export async function PATCH(request: Request, { params }: MessageRouteContext) {
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

  const parsedBody = updateSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const message = await updateHubMessage({
      content: parsedBody.data.content,
      messageId: params.messageId,
      userId: session.user.id,
    });

    await broadcastUpdate(params.messageId, session.user.id);

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the message." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: MessageRouteContext) {
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

  try {
    const message = await deleteHubMessage({
      messageId: params.messageId,
      userId: session.user.id,
    });

    await broadcastUpdate(params.messageId, session.user.id);

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the message." },
      { status: 400 },
    );
  }
}
