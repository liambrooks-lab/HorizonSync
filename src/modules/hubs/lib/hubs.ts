import { randomUUID } from "crypto";
import { ChannelType, MemberRole } from "@prisma/client";

import { db } from "@/shared/lib/db";
import {
  sanitizeOptionalPlainText,
  sanitizeOptionalUrl,
  sanitizePlainText,
} from "@/shared/lib/security";
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

export type SerializedHubReaction = {
  emoji: string;
  count: number;
  reactedByViewer: boolean;
};

export type SerializedHubMessage = {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  deleted: boolean;
  reactions: SerializedHubReaction[];
  threadSummary: {
    threadId: string;
    replyCount: number;
    updatedAt: string;
  } | null;
  forwardedFrom: {
    id: string;
    content: string;
    authorName: string;
  } | null;
  author: {
    userId: string;
    memberId: string;
    name: string;
    image: string | null;
    role: MemberRole;
  };
};

export type SerializedHubThread = {
  id: string;
  title: string;
  rootMessage: SerializedHubMessage;
  messages: SerializedHubMessage[];
  updatedAt: string;
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

function buildMessageInclude() {
  return {
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
    reactions: {
      select: {
        emoji: true,
        userId: true,
      },
    },
    forwardedFrom: {
      select: {
        id: true,
        content: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
    rootThread: {
      select: {
        id: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    },
  } as const;
}

function groupReactions(
  reactions: Array<{
    emoji: string;
    userId: string;
  }>,
  viewerId: string,
) {
  return Array.from(
    reactions.reduce((map, reaction) => {
      const existingReaction = map.get(reaction.emoji) ?? {
        emoji: reaction.emoji,
        count: 0,
        reactedByViewer: false,
      };

      existingReaction.count += 1;
      existingReaction.reactedByViewer ||= reaction.userId === viewerId;
      map.set(reaction.emoji, existingReaction);
      return map;
    }, new Map<string, SerializedHubReaction>()),
  )
    .map(([, reaction]) => reaction)
    .sort((left, right) => right.count - left.count || left.emoji.localeCompare(right.emoji));
}

function serializeMessage(
  message: {
    id: string;
    content: string;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    deleted: boolean;
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
    reactions: Array<{
      emoji: string;
      userId: string;
    }>;
    forwardedFrom: {
      id: string;
      content: string;
      user: {
        name: string | null;
        email: string | null;
      };
    } | null;
    rootThread: {
      id: string;
      updatedAt: Date;
      _count: {
        messages: number;
      };
    } | null;
  },
  viewerId: string,
): SerializedHubMessage {
  return {
    id: message.id,
    content: message.deleted ? "This message was deleted." : message.content,
    fileUrl: message.deleted ? null : message.fileUrl,
    fileName: message.deleted ? null : message.fileName,
    fileType: message.deleted ? null : message.fileType,
    fileSize: message.deleted ? null : message.fileSize,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    isEdited: message.isEdited,
    deleted: message.deleted,
    reactions: groupReactions(message.reactions, viewerId),
    threadSummary: message.rootThread
      ? {
          threadId: message.rootThread.id,
          replyCount: message.rootThread._count.messages,
          updatedAt: message.rootThread.updatedAt.toISOString(),
        }
      : null,
    forwardedFrom: message.forwardedFrom
      ? {
          id: message.forwardedFrom.id,
          content: message.forwardedFrom.content,
          authorName:
            message.forwardedFrom.user.name ?? message.forwardedFrom.user.email ?? "Unknown member",
        }
      : null,
    author: {
      memberId: message.member.id,
      userId: message.user.id,
      name: message.user.name ?? message.user.email ?? "Unknown member",
      image: message.user.image,
      role: message.member.role,
    },
  };
}

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

export function getMessageThreadChannelName(threadId: string) {
  return `private-thread-replies-${threadId}`;
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

async function resolveConversation(serverId: string, currentMemberId: string, targetMemberId: string) {
  const [memberOneId, memberTwoId] = normalizeMemberPair(currentMemberId, targetMemberId);

  const conversation = await db.directMessageConversation.upsert({
    where: {
      serverId_memberOneId_memberTwoId: {
        serverId,
        memberOneId,
        memberTwoId,
      },
    },
    update: {},
    create: {
      serverId,
      memberOneId,
      memberTwoId,
      userOneId: "",
      userTwoId: "",
    },
    select: {
      id: true,
    },
  });

  return {
    conversationId: conversation.id,
    memberIds: [memberOneId, memberTwoId] as [string, string],
  };
}

async function resolveRouteContext(serverId: string, routeId: string, userId: string) {
  const workspace = await getServerWorkspace(serverId, userId);

  if (!workspace) {
    throw new Error("You are not a member of this hub.");
  }

  if (!isDirectMessageRouteId(routeId)) {
    const channel = workspace.server.channels.find((candidate) => candidate.id === routeId);

    if (!channel) {
      throw new Error("Channel not found.");
    }

    return {
      kind: "channel" as const,
      workspace,
      channelId: channel.id,
      descriptor: {
        kind: "channel" as const,
        realtimeChannelName: getThreadChannelName({
          kind: "channel",
          channelId: channel.id,
          serverId,
        }),
      },
    };
  }

  const targetMemberId = getDirectMessageTargetMemberId(routeId);
  const targetMember = workspace.server.members.find((member) => member.id === targetMemberId);

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
        serverId,
        memberOneId,
        memberTwoId,
      },
    },
    update: {
      userOneId:
        memberOneId === workspace.currentMember.id
          ? workspace.currentMember.userId
          : targetMember.userId,
      userTwoId:
        memberTwoId === workspace.currentMember.id
          ? workspace.currentMember.userId
          : targetMember.userId,
    },
    create: {
      serverId,
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

  return {
    kind: "direct" as const,
    workspace,
    conversationId: conversation.id,
    memberIds: [memberOneId, memberTwoId] as [string, string],
    descriptor: {
      kind: "direct" as const,
      realtimeChannelName: getThreadChannelName({
        kind: "direct",
        memberIds: [memberOneId, memberTwoId],
        serverId,
      }),
    },
  };
}

export async function getHubThreadData(serverId: string, routeId: string, userId: string) {
  const workspace = await getServerWorkspace(serverId, userId);

  if (!workspace) {
    return null;
  }

  const baseResult = {
    workspace,
    serverPresenceChannelName: getServerPresenceChannelName(serverId),
  };

  if (!isDirectMessageRouteId(routeId)) {
    const channel = workspace.server.channels.find((candidate) => candidate.id === routeId);

    if (!channel) {
      return null;
    }

    const messages = await db.message.findMany({
      where: {
        channelId: channel.id,
        threadId: null,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: buildMessageInclude(),
      take: 100,
    });

    const descriptor: HubThreadDescriptor = {
      kind: "channel",
      routeId,
      title: channel.name,
      subtitle: channel.description ?? "Collaborate with your hub in real time.",
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
      messages: messages.map((message) => serializeMessage(message, userId)),
    };
  }

  const targetMemberId = getDirectMessageTargetMemberId(routeId);
  const targetMember = workspace.server.members.find((member) => member.id === targetMemberId);

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
        where: {
          threadId: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: buildMessageInclude(),
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
    messages: (conversation?.messages ?? []).map((message) => serializeMessage(message, userId)),
  };
}

export async function getSerializedHubMessageById(messageId: string, userId: string) {
  const message = await db.message.findFirst({
    where: {
      id: messageId,
      OR: [
        {
          channel: {
            server: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
        {
          directMessageConversation: {
            server: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      ],
    },
    include: buildMessageInclude(),
  });

  if (!message) {
    return null;
  }

  return serializeMessage(message, userId);
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
  forwardedFromId?: string | null;
  threadId?: string | null;
}) {
  const trimmedContent = sanitizePlainText(input.content, 4000);
  const fileUrl = sanitizeOptionalUrl(input.fileUrl);
  const fileName = sanitizeOptionalPlainText(input.fileName, 255);
  const fileType = sanitizeOptionalPlainText(input.fileType, 255);
  const forwardedFromId = input.forwardedFromId ?? null;
  const routeContext = await resolveRouteContext(input.serverId, input.routeId, input.userId);

  if (!trimmedContent && !fileUrl && !forwardedFromId) {
    throw new Error("A message must contain text, an attachment, or a forwarded reference.");
  }

  if (forwardedFromId) {
    const forwardedMessage = await db.message.findFirst({
      where: {
        id: forwardedFromId,
        OR: [
          { channel: { serverId: input.serverId } },
          { directMessageConversation: { serverId: input.serverId } },
        ],
      },
      select: { id: true },
    });

    if (!forwardedMessage) {
      throw new Error("Original message not found.");
    }
  }

  let threadId = input.threadId ?? null;

  if (threadId) {
    const thread = await db.thread.findFirst({
      where: {
        id: threadId,
        serverId: input.serverId,
      },
      select: {
        id: true,
        channelId: true,
        directMessageConversationId: true,
      },
    });

    if (!thread) {
      throw new Error("Thread not found.");
    }

    if (routeContext.kind === "channel" && thread.channelId !== routeContext.channelId) {
      throw new Error("Thread does not belong to this channel.");
    }

    if (
      routeContext.kind === "direct" &&
      thread.directMessageConversationId !== routeContext.conversationId
    ) {
      throw new Error("Thread does not belong to this conversation.");
    }
  }

  const message = await db.message.create({
    data: {
      channelId: routeContext.kind === "channel" ? routeContext.channelId : null,
      content: trimmedContent,
      directMessageConversationId:
        routeContext.kind === "direct" ? routeContext.conversationId : null,
      fileUrl,
      fileName,
      fileType,
      fileSize: input.fileSize ?? null,
      forwardedFromId,
      memberId: routeContext.workspace.currentMember.id,
      threadId,
      userId: routeContext.workspace.currentMember.userId,
    },
    include: buildMessageInclude(),
  });

  return {
    message: serializeMessage(message, input.userId),
    realtimeChannelName: threadId
      ? getMessageThreadChannelName(threadId)
      : routeContext.descriptor.realtimeChannelName,
  };
}

export async function updateHubMessage(input: {
  messageId: string;
  userId: string;
  content: string;
}) {
  const trimmedContent = sanitizePlainText(input.content, 4000);

  if (!trimmedContent) {
    throw new Error("Message content cannot be empty.");
  }

  const message = await db.message.findFirst({
    where: {
      id: input.messageId,
      userId: input.userId,
    },
    include: {
      channel: {
        select: {
          serverId: true,
        },
      },
      directMessageConversation: {
        select: {
          serverId: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  await db.message.update({
    where: { id: message.id },
    data: {
      content: trimmedContent,
      isEdited: true,
    },
  });

  return getSerializedHubMessageById(message.id, input.userId);
}

export async function deleteHubMessage(input: {
  messageId: string;
  userId: string;
}) {
  const message = await db.message.findFirst({
    where: {
      id: input.messageId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  await db.message.update({
    where: { id: message.id },
    data: {
      content: "",
      deleted: true,
      fileName: null,
      fileSize: null,
      fileType: null,
      fileUrl: null,
      isEdited: true,
    },
  });

  return getSerializedHubMessageById(message.id, input.userId);
}

export async function toggleMessageReaction(input: {
  emoji: string;
  messageId: string;
  userId: string;
}) {
  const emoji = sanitizePlainText(input.emoji, 16);

  if (!emoji) {
    throw new Error("Reaction emoji is required.");
  }

  const message = await db.message.findFirst({
    where: {
      id: input.messageId,
      OR: [
        {
          channel: {
            server: {
              members: {
                some: {
                  userId: input.userId,
                },
              },
            },
          },
        },
        {
          directMessageConversation: {
            server: {
              members: {
                some: {
                  userId: input.userId,
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      channel: {
        select: {
          serverId: true,
        },
      },
      directMessageConversation: {
        select: {
          serverId: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  const membership = await db.member.findFirst({
    where: {
      userId: input.userId,
      serverId: message.channel?.serverId ?? message.directMessageConversation?.serverId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this hub.");
  }

  const existingReaction = await db.reaction.findUnique({
    where: {
      messageId_memberId_emoji: {
        emoji,
        memberId: membership.id,
        messageId: message.id,
      },
    },
  });

  if (existingReaction) {
    await db.reaction.delete({
      where: { id: existingReaction.id },
    });
  } else {
    await db.reaction.create({
      data: {
        emoji,
        memberId: membership.id,
        messageId: message.id,
        userId: input.userId,
      },
    });
  }

  return getSerializedHubMessageById(message.id, input.userId);
}

export async function ensureThreadForMessage(input: {
  rootMessageId: string;
  userId: string;
}) {
  const rootMessage = await db.message.findFirst({
    where: {
      id: input.rootMessageId,
      threadId: null,
      OR: [
        {
          channel: {
            server: {
              members: {
                some: {
                  userId: input.userId,
                },
              },
            },
          },
        },
        {
          directMessageConversation: {
            server: {
              members: {
                some: {
                  userId: input.userId,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      channel: {
        select: {
          id: true,
          serverId: true,
          name: true,
        },
      },
      directMessageConversation: {
        select: {
          id: true,
          serverId: true,
        },
      },
      rootThread: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!rootMessage) {
    throw new Error("Root message not found.");
  }

  if (rootMessage.rootThread) {
    return rootMessage.rootThread.id;
  }

  const thread = await db.thread.create({
    data: {
      channelId: rootMessage.channelId,
      creatorId: input.userId,
      directMessageConversationId: rootMessage.directMessageConversationId,
      rootMessageId: rootMessage.id,
      serverId: rootMessage.channel?.serverId ?? rootMessage.directMessageConversation?.serverId ?? "",
      title:
        rootMessage.channel?.name
          ? `Thread in #${rootMessage.channel.name}`
          : "Direct message thread",
    },
    select: {
      id: true,
    },
  });

  return thread.id;
}

export async function getThreadById(threadId: string, userId: string) {
  const thread = await db.thread.findFirst({
    where: {
      id: threadId,
      server: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      rootMessage: {
        include: buildMessageInclude(),
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: buildMessageInclude(),
      },
    },
  });

  if (!thread) {
    return null;
  }

  return {
    id: thread.id,
    title: thread.title ?? "Thread",
    rootMessage: serializeMessage(thread.rootMessage, userId),
    messages: thread.messages.map((message) => serializeMessage(message, userId)),
    updatedAt: thread.updatedAt.toISOString(),
  } satisfies SerializedHubThread;
}
