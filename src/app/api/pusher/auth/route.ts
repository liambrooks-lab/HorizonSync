import { NextResponse } from "next/server";

import { getMessageThreadChannelName, getServerPresenceChannelName } from "@/modules/hubs/lib/hubs";
import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { isPusherConfigured, pusherServer } from "@/shared/lib/pusher";

function isPresenceServerChannel(channelName: string) {
  return channelName.startsWith("presence-server-");
}

function isChannelThreadChannel(channelName: string) {
  return channelName.startsWith("private-thread-channel-");
}

function isDirectThreadChannel(channelName: string) {
  return channelName.startsWith("private-thread-dm-");
}

function isMessageRepliesChannel(channelName: string) {
  return channelName.startsWith("private-thread-replies-");
}

export async function POST(request: Request) {
  if (!isPusherConfigured || !pusherServer) {
    return NextResponse.json(
      { error: "Realtime is not configured." },
      { status: 503 },
    );
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const socketId = String(formData.get("socket_id") ?? "");
  const channelName = String(formData.get("channel_name") ?? "");

  if (!socketId || !channelName) {
    return NextResponse.json(
      { error: "Missing Pusher authentication payload." },
      { status: 400 },
    );
  }

  if (isPresenceServerChannel(channelName)) {
    const serverId = channelName.replace(getServerPresenceChannelName(""), "");
    const membership = await db.member.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const auth = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: membership.id,
      user_info: {
        name: membership.user.name ?? "Unknown member",
        image: membership.user.image,
        role: membership.role,
      },
    });

    return NextResponse.json(auth);
  }

  if (isChannelThreadChannel(channelName)) {
    const channelId = channelName.replace("private-thread-channel-", "");
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: {
        serverId: true,
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const membership = await db.member.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: channel.serverId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      pusherServer.authorizeChannel(socketId, channelName),
    );
  }

  if (isDirectThreadChannel(channelName)) {
    const [, , , serverId, memberOneId, memberTwoId] = channelName.split("-");

    const membership = await db.member.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership || ![memberOneId, memberTwoId].includes(membership.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      pusherServer.authorizeChannel(socketId, channelName),
    );
  }

  if (isMessageRepliesChannel(channelName)) {
    const threadId = channelName.replace(getMessageThreadChannelName(""), "");
    const thread = await db.thread.findUnique({
      where: { id: threadId },
      select: {
        serverId: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const membership = await db.member.findUnique({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId: thread.serverId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  }

  return NextResponse.json(
    { error: "Unsupported Pusher channel." },
    { status: 400 },
  );
}
