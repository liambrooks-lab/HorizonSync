"use client";

import { useEffect, useRef, useState } from "react";

import type { SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { getPusherClient } from "@/modules/hubs/lib/pusher-client";

type UseChatSocketOptions = {
  currentMemberId: string;
  currentMemberName: string;
  initialMessages: SerializedHubMessage[];
  realtimeChannelName: string;
  serverPresenceChannelName: string;
};

function useHubPresence(serverPresenceChannelName: string) {
  const [onlineMemberIds, setOnlineMemberIds] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<
    "connected" | "connecting" | "unavailable"
  >("connecting");

  useEffect(() => {
    const pusherClient = getPusherClient();

    if (!pusherClient) {
      setConnectionState("unavailable");
      return;
    }

    const client = pusherClient;

    function handleConnectionChange() {
      const state = client.connection.state;
      setConnectionState(state === "connected" ? "connected" : "connecting");
    }

    handleConnectionChange();
    client.connection.bind("state_change", handleConnectionChange);

    const presenceChannel = client.subscribe(serverPresenceChannelName);

    const syncPresenceMembers = () => {
      const presenceMembers = (presenceChannel as { members?: {
        each: (callback: (member: { id: string }) => void) => void;
      } }).members;

      if (!presenceMembers) {
        return;
      }

      const nextOnlineMembers: string[] = [];
      presenceMembers.each((member: { id: string }) => {
        nextOnlineMembers.push(member.id);
      });
      setOnlineMemberIds(nextOnlineMembers);
    };

    presenceChannel.bind("pusher:subscription_succeeded", syncPresenceMembers);
    presenceChannel.bind("pusher:member_added", syncPresenceMembers);
    presenceChannel.bind("pusher:member_removed", syncPresenceMembers);

    return () => {
      client.connection.unbind("state_change", handleConnectionChange);
      client.unsubscribe(serverPresenceChannelName);
    };
  }, [serverPresenceChannelName]);

  return {
    connectionState,
    onlineMemberIds,
  };
}

function dedupeMessages(messages: SerializedHubMessage[]) {
  return Array.from(
    new Map(messages.map((message) => [message.id, message])).values(),
  ).sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function useChatSocket({
  currentMemberId,
  currentMemberName,
  initialMessages,
  realtimeChannelName,
  serverPresenceChannelName,
}: UseChatSocketOptions) {
  const [messages, setMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const { connectionState, onlineMemberIds } = useHubPresence(
    serverPresenceChannelName,
  );
  const typingTimeoutRef = useRef<Record<string, number>>({});
  const threadChannelRef = useRef<any>(null);
  const lastTypingEventRef = useRef<number>(0);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const pusherClient = getPusherClient();

    if (!pusherClient) {
      return;
    }
    const client = pusherClient;
    const threadChannel = client.subscribe(realtimeChannelName);
    threadChannelRef.current = threadChannel;

    threadChannel.bind("message:new", (event: { message: SerializedHubMessage }) => {
      setMessages((currentMessages) =>
        dedupeMessages([...currentMessages, event.message]),
      );
    });

    threadChannel.bind("message:update", (event: { message: SerializedHubMessage }) => {
      setMessages((currentMessages) =>
        dedupeMessages(
          currentMessages.map((currentMessage) =>
            currentMessage.id === event.message.id ? event.message : currentMessage,
          ),
        ),
      );
    });

    threadChannel.bind(
      "client-typing",
      (event: { memberId: string; name: string }) => {
        if (event.memberId === currentMemberId) {
          return;
        }

        setTypingUsers((currentTypingUsers) => ({
          ...currentTypingUsers,
          [event.memberId]: event.name,
        }));

        window.clearTimeout(typingTimeoutRef.current[event.memberId]);
        typingTimeoutRef.current[event.memberId] = window.setTimeout(() => {
          setTypingUsers((currentTypingUsers) => {
            const nextTypingUsers = { ...currentTypingUsers };
            delete nextTypingUsers[event.memberId];
            return nextTypingUsers;
          });
          delete typingTimeoutRef.current[event.memberId];
        }, 1800);
      },
    );

    return () => {
      Object.values(typingTimeoutRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      typingTimeoutRef.current = {};
      client.unsubscribe(realtimeChannelName);
    };
  }, [
    currentMemberId,
    realtimeChannelName,
  ]);

  function appendLocalMessage(message: SerializedHubMessage) {
    setMessages((currentMessages) => dedupeMessages([...currentMessages, message]));
  }

  function updateLocalMessage(message: SerializedHubMessage) {
    setMessages((currentMessages) =>
      dedupeMessages(
        currentMessages.map((currentMessage) =>
          currentMessage.id === message.id ? message : currentMessage,
        ),
      ),
    );
  }

  function announceTyping() {
    const now = Date.now();

    if (now - lastTypingEventRef.current < 1200) {
      return;
    }

    lastTypingEventRef.current = now;

    try {
      threadChannelRef.current?.trigger("client-typing", {
        memberId: currentMemberId,
        name: currentMemberName,
      });
    } catch {
      // Pusher client events are best-effort; failing to emit typing should
      // never break the actual message composer.
    }
  }

  return {
    appendLocalMessage,
    announceTyping,
    connectionState,
    messages,
    onlineMemberIds,
    updateLocalMessage,
    typingUsers: Object.values(typingUsers),
  };
}

export { useHubPresence };
