"use client";

import { useState } from "react";

import type { HubThreadDescriptor, SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { useChatSocket } from "@/modules/hubs/hooks/useChatSocket";
import { ChatHeader } from "@/modules/hubs/components/ChatHeader";
import { ChatInput } from "@/modules/hubs/components/ChatInput";
import { MessageList } from "@/modules/hubs/components/MessageList";
import { ThreadPanel } from "@/modules/hubs/components/ThreadPanel";
import { useToast } from "@/shared/components/ui/toast";

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
  const { showToast } = useToast();
  const {
    appendLocalMessage,
    announceTyping,
    connectionState,
    messages,
    onlineMemberIds,
    typingUsers,
    updateLocalMessage,
  } = useChatSocket({
    currentMemberId: currentMember.id,
    currentMemberName: currentMember.name,
    initialMessages,
    realtimeChannelName: descriptor.realtimeChannelName,
    serverPresenceChannelName,
  });
  const [selectedThreadMessage, setSelectedThreadMessage] = useState<SerializedHubMessage | null>(null);

  const isTargetOnline = descriptor.targetMemberId
    ? onlineMemberIds.includes(descriptor.targetMemberId)
    : false;

  async function patchMessage(messageId: string, content: string) {
    const response = await fetch(`/api/hubs/messages/${messageId}`, {
      body: JSON.stringify({ content }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: SerializedHubMessage;
    };

    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? "Unable to update the message.");
    }

    updateLocalMessage(payload.message);
  }

  async function deleteMessage(messageId: string) {
    const response = await fetch(`/api/hubs/messages/${messageId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: SerializedHubMessage;
    };

    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? "Unable to delete the message.");
    }

    updateLocalMessage(payload.message);
  }

  async function reactToMessage(messageId: string, emoji: string) {
    const response = await fetch(`/api/hubs/messages/${messageId}/reaction`, {
      body: JSON.stringify({ emoji }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: SerializedHubMessage;
    };

    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? "Unable to react to the message.");
    }

    updateLocalMessage(payload.message);
  }

  async function forwardMessage(messageId: string) {
    const response = await fetch("/api/hubs/messages", {
      body: JSON.stringify({
        content: "",
        forwardedFromId: messageId,
        routeId: descriptor.routeId,
        serverId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      message?: SerializedHubMessage;
    };

    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? "Unable to forward the message.");
    }

    appendLocalMessage(payload.message);
  }

  return (
    <section className="panel-surface flex h-[calc(100vh-14rem)] min-h-[560px] flex-1 overflow-hidden rounded-[30px] border border-[rgb(var(--border))] backdrop-blur-xl sm:h-[calc(100vh-13rem)] lg:h-[calc(100vh-10.5rem)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          connectionState={connectionState}
          descriptor={descriptor}
          isTargetOnline={isTargetOnline}
          onlineCount={onlineMemberIds.length}
        />
        <MessageList
          currentMemberId={currentMember.id}
          messages={messages}
          onDeleteMessage={async (messageId) => {
            try {
              await deleteMessage(messageId);
            } catch (error) {
              showToast({
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Unable to delete the message.",
                variant: "error",
              });
            }
          }}
          onForwardMessage={async (messageId) => {
            try {
              await forwardMessage(messageId);
              showToast({
                title: "Message forwarded",
                description: "The message has been forwarded into the current conversation.",
                variant: "success",
              });
            } catch (error) {
              showToast({
                title: "Forward failed",
                description: error instanceof Error ? error.message : "Unable to forward the message.",
                variant: "error",
              });
            }
          }}
          onOpenThread={async (message) => {
            setSelectedThreadMessage(message);
          }}
          onReactToMessage={async (messageId, emoji) => {
            try {
              await reactToMessage(messageId, emoji);
            } catch (error) {
              showToast({
                title: "Reaction failed",
                description: error instanceof Error ? error.message : "Unable to update the reaction.",
                variant: "error",
              });
            }
          }}
          onUpdateMessage={async (messageId, content) => {
            try {
              await patchMessage(messageId, content);
            } catch (error) {
              showToast({
                title: "Edit failed",
                description: error instanceof Error ? error.message : "Unable to update the message.",
                variant: "error",
              });
            }
          }}
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
      </div>

      {selectedThreadMessage ? (
        <ThreadPanel
          currentMember={currentMember}
          onClose={() => setSelectedThreadMessage(null)}
          routeId={descriptor.routeId}
          selectedMessage={selectedThreadMessage}
          serverId={serverId}
        />
      ) : null}
    </section>
  );
}
