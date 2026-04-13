"use client";

import type { HubThreadDescriptor, SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { useChatSocket } from "@/modules/hubs/hooks/useChatSocket";
import { ChatHeader } from "@/modules/hubs/components/ChatHeader";
import { ChatInput } from "@/modules/hubs/components/ChatInput";
import { MessageList } from "@/modules/hubs/components/MessageList";

type ChatWindowProps = {
  currentMember: {
    id: string;
    name: string;
  };
  descriptor: HubThreadDescriptor;
  initialMessages: SerializedHubMessage[];
  serverId: string;
  serverPresenceChannelName: string;
};

export function ChatWindow({
  currentMember,
  descriptor,
  initialMessages,
  serverId,
  serverPresenceChannelName,
}: ChatWindowProps) {
  const {
    appendLocalMessage,
    announceTyping,
    connectionState,
    messages,
    onlineMemberIds,
    typingUsers,
  } = useChatSocket({
    currentMemberId: currentMember.id,
    currentMemberName: currentMember.name,
    initialMessages,
    realtimeChannelName: descriptor.realtimeChannelName,
    serverPresenceChannelName,
  });

  const isTargetOnline = descriptor.targetMemberId
    ? onlineMemberIds.includes(descriptor.targetMemberId)
    : false;

  return (
    <section className="panel-surface flex h-[calc(100vh-14rem)] min-h-[560px] flex-1 flex-col overflow-hidden rounded-[30px] border border-[rgb(var(--border))] backdrop-blur-xl sm:h-[calc(100vh-13rem)] lg:h-[calc(100vh-10.5rem)]">
      <ChatHeader
        connectionState={connectionState}
        descriptor={descriptor}
        isTargetOnline={isTargetOnline}
        onlineCount={onlineMemberIds.length}
      />
      <MessageList
        currentMemberId={currentMember.id}
        messages={messages}
        typingUsers={typingUsers}
      />
      <ChatInput
        disabled={false}
        onMessageCreated={appendLocalMessage}
        onTyping={announceTyping}
        placeholder={descriptor.placeholder}
        routeId={descriptor.routeId}
        serverId={serverId}
      />
    </section>
  );
}
