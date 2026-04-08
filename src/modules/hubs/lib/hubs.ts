import { randomUUID } from "crypto";
import { ChannelType, MemberRole } from "@prisma/client";

import { db } from "@/shared/lib/db";
import { slugify } from "@/shared/lib/utils";

const DEFAULT_CHANNEL_BLUEPRINTS = [
  {
    name: "announcements",
    description: "Leadership and release updates for this hub.",
    position: 0,
    type: ChannelType.TEXT,
  },
  {
    name: "general",
    description: "Day-to-day team discussion.",
    position: 1,
    type: ChannelType.TEXT,
  },
  {
    name: "standup",
    description: "Quick voice syncs for the team.",
    position: 2,
    type: ChannelType.AUDIO,
  },
  {
    name: "war-room",
    description: "High-bandwidth video collaboration.",
    position: 3,
    type: ChannelType.VIDEO,
  },
] as const;

export type SerializedHubMessage = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  author: {
    userId: string;
    memberId: string;
    name: string;
    image: string | null;
    role: MemberRole;
  };
};

export type HubThreadDescriptor = {
  kind: "channel" | "direct";
  routeId: string;
  title: string;
  subtitle: string;
  icon: "text" | "audio" | "video" | "direct";
  placeholder: string;
  realtimeChannelName: string;
  targetMemberId?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserImage?: string | null;
  channelId?: string;
};

export function buildDirectMessageRouteId(memberId: string) {
  return `dm-${memberId}`;
}

export function isDirectMessageRouteId(routeId: string) {
  return routeId.startsWith("dm-");
}

export function getDirectMessageTargetMemberId(routeId: string) {
  return routeId.replace(/^dm-/, "");
}

function normalizeMemberPair(memberOneId: string, memberTwoId: string) {
  return [memberOneId, memberTwoId].sort((left, right) =>
    left.localeCompare(right),
  ) as [string, string];
}

function buildInviteCode(serverName: string) {
  return `${slugify(serverName)}-${randomUUID().slice(0, 8)}`;
}

export function getThreadChannelName(input: {
  kind: "channel" | "direct";
  channelId?: string;
  serverId: string;
  memberIds?: [string, string];
}) {
  if (input.kind === "channel") {
    return `private-thread-channel-${input.channelId}`;
  }

  return `private-thread-dm-${input.serverId}-${input.memberIds?.join("-")}`;
}

export function getServerPresenceChannelName(serverId: string) {
  return `presence-server-${serverId}`;
}

export async function ensurePersonalHubWorkspace(userId: string) {
  const existingMembership = await db.member.findFirst({
    where: { userId },
    select: { serverId: true },
  });

  if (existingMembership) {
    return existingMembership.serverId;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const serverName = `${user.name?.split(" ")[0] ?? "My"} Hub`;

  const server = await db.server.create({
    data: {
      name: serverName,
      inviteCode: buildInviteCode(serverName),
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: MemberRole.ADMIN,
        },
      },
      channels: {
        create: DEFAULT_CHANNEL_BLUEPRINTS.map((channel) => ({
          ...channel,
          userId: user.id,
        })),
      },
    },
    select: { id: true },
  });

  return server.id;
}

export async function getHubServersForUser(userId: string) {
  await ensurePersonalHubWorkspace(userId);

  return db.server.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      channels: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, type: true },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getServerWorkspace(serverId: string, userId: string) {
  const membership = await db.member.findUnique({
    where: {
      userId_serverId: {
        userId,
        serverId,
      },
    },
    include: {
      user: true,
      server: {
        include: {
          channels: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          },
          members: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  const directMessageTargets = membership.server.members
    .filter((member) => member.id !== membership.id)
    .map((member) => ({
      routeId: buildDirectMessageRouteId(member.id),
      memberId: member.id,
      userId: member.userId,
      name: member.user.name ?? member.user.email ?? "Unknown member",
      image: member.user.image,
      role: member.role,
    }));

  return {
    currentMember: {
      id: membership.id,
      role: membership.role,
      userId: membership.userId,
      name: membership.user.name ?? membership.user.email ?? "You",
      image: membership.user.image,
    },
    server: {
      id: membership.server.id,
      name: membership.server.name,
      imageUrl: membership.server.imageUrl,
      channels: membership.server.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        position: channel.position,
      })),
      members: membership.server.members.map((member) => ({
        id: member.id,
        role: member.role,
        userId: member.userId,
        name: member.user.name ?? member.user.email ?? "Unknown member",
        image: member.user.image,
      })),
    },
    directMessageTargets,
  };
}

function serializeMessage(message: {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    role: MemberRole;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}): SerializedHubMessage {
  return {
    id: message.id,
    content: message.content,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileType: message.fileType,
    fileSize: message.fileSize,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    author: {
      memberId: message.member.id,
      userId: message.user.id,
      name: message.user.name ?? message.user.email ?? "Unknown member",
      image: message.user.image,
      role: message.member.role,
    },
  };
}

export async function getHubThreadData(
  serverId: string,
  routeId: string,
  userId: string,
) {
  const workspace = await getServerWorkspace(serverId, userId);

  if (!workspace) {
    return null;
  }

  const baseResult = {
    workspace,
    serverPresenceChannelName: getServerPresenceChannelName(serverId),
  };

  if (!isDirectMessageRouteId(routeId)) {
    const channel = workspace.server.channels.find(
      (candidate) => candidate.id === routeId,
    );

    if (!channel) {
      return null;
    }

    const messages = await db.message.findMany({
      where: {
        channelId: channel.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        member: {
          select: {
            id: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      take: 100,
    });

    const descriptor: HubThreadDescriptor = {
      kind: "channel",
      routeId,
      title: channel.name,
      subtitle:
        channel.description ??
        "Collaborate with your hub in real time.",
      icon:
        channel.type === ChannelType.AUDIO
          ? "audio"
          : channel.type === ChannelType.VIDEO
            ? "video"
            : "text",
      placeholder:
        channel.type === ChannelType.TEXT
          ? `Message #${channel.name}`
          : `Share an update in ${channel.name}`,
      realtimeChannelName: getThreadChannelName({
        kind: "channel",
        channelId: channel.id,
        serverId,
      }),
      channelId: channel.id,
    };

    return {
      ...baseResult,
      descriptor,
      messages: messages.map(serializeMessage),
    };
  }

  const targetMemberId = getDirectMessageTargetMemberId(routeId);
  const targetMember = workspace.server.members.find(
    (member) => member.id === targetMemberId,
  );

  if (!targetMember || targetMember.id === workspace.currentMember.id) {
    return null;
  }

  const memberIds = normalizeMemberPair(workspace.currentMember.id, targetMember.id);
  const conversation = await db.directMessageConversation.findUnique({
    where: {
      serverId_memberOneId_memberTwoId: {
        serverId,
        memberOneId: memberIds[0],
        memberTwoId: memberIds[1],
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          member: {
            select: {
              id: true,
              role: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: 100,
      },
    },
  });

  const descriptor: HubThreadDescriptor = {
    kind: "direct",
    routeId,
    title: targetMember.name,
    subtitle: "Private conversation inside this hub.",
    icon: "direct",
    placeholder: `Message ${targetMember.name}`,
    realtimeChannelName: getThreadChannelName({
      kind: "direct",
      serverId,
      memberIds,
    }),
    targetMemberId: targetMember.id,
    targetUserId: targetMember.userId,
    targetUserName: targetMember.name,
    targetUserImage: targetMember.image,
  };

  return {
    ...baseResult,
    descriptor,
    messages: (conversation?.messages ?? []).map(serializeMessage),
  };
}

export async function createHubMessage(input: {
  serverId: string;
  routeId: string;
  userId: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}) {
  const trimmedContent = input.content.trim();

  if (!trimmedContent && !input.fileUrl) {
    throw new Error("A message must contain text or an attachment.");
  }

  const workspace = await getServerWorkspace(input.serverId, input.userId);

  if (!workspace) {
    throw new Error("You are not a member of this hub.");
  }

  if (!isDirectMessageRouteId(input.routeId)) {
    const channel = workspace.server.channels.find(
      (candidate) => candidate.id === input.routeId,
    );

    if (!channel) {
      throw new Error("Channel not found.");
    }

    const message = await db.message.create({
      data: {
        channelId: channel.id,
        content: trimmedContent,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize ?? null,
        memberId: workspace.currentMember.id,
        userId: workspace.currentMember.userId,
      },
      include: {
        member: {
          select: {
            id: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return {
      message: serializeMessage(message),
      realtimeChannelName: getThreadChannelName({
        kind: "channel",
        channelId: channel.id,
        serverId: input.serverId,
      }),
    };
  }

  const targetMemberId = getDirectMessageTargetMemberId(input.routeId);
  const targetMember = workspace.server.members.find(
    (member) => member.id === targetMemberId,
  );

  if (!targetMember || targetMember.id === workspace.currentMember.id) {
    throw new Error("Direct message target not found.");
  }

  const [memberOneId, memberTwoId] = normalizeMemberPair(
    workspace.currentMember.id,
    targetMember.id,
  );

  const conversation = await db.directMessageConversation.upsert({
    where: {
      serverId_memberOneId_memberTwoId: {
        serverId: input.serverId,
        memberOneId,
        memberTwoId,
      },
    },
    update: {},
    create: {
      serverId: input.serverId,
      memberOneId,
      memberTwoId,
      userOneId:
        memberOneId === workspace.currentMember.id
          ? workspace.currentMember.userId
          : targetMember.userId,
      userTwoId:
        memberTwoId === workspace.currentMember.id
          ? workspace.currentMember.userId
          : targetMember.userId,
    },
    select: {
      id: true,
    },
  });

  const message = await db.message.create({
    data: {
      content: trimmedContent,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize ?? null,
      memberId: workspace.currentMember.id,
      userId: workspace.currentMember.userId,
      directMessageConversationId: conversation.id,
    },
    include: {
      member: {
        select: {
          id: true,
          role: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return {
    message: serializeMessage(message),
    realtimeChannelName: getThreadChannelName({
      kind: "direct",
      serverId: input.serverId,
      memberIds: [memberOneId, memberTwoId],
    }),
  };
}
