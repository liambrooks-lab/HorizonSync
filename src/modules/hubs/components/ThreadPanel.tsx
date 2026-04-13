"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { SerializedHubMessage, SerializedHubThread } from "@/modules/hubs/lib/hubs";
import { ChatInput } from "@/modules/hubs/components/ChatInput";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/components/ui/toast";

type ThreadPanelProps = {
  currentMember: {
    id: string;
    name: string;
  };
  onClose: () => void;
  routeId: string;
  selectedMessage: SerializedHubMessage;
  serverId: string;
};

export function ThreadPanel({
  currentMember,
  onClose,
  routeId,
  selectedMessage,
  serverId,
}: ThreadPanelProps) {
  const { showToast } = useToast();
  const [thread, setThread] = useState<SerializedHubThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadThread() {
      try {
        setIsLoading(true);

        let threadId = selectedMessage.threadSummary?.threadId ?? null;

        if (!threadId) {
          const createResponse = await fetch("/api/hubs/threads", {
            body: JSON.stringify({
              rootMessageId: selectedMessage.id,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });
          const createPayload = (await createResponse.json()) as {
            error?: string;
            thread?: SerializedHubThread;
          };

          if (!createResponse.ok || !createPayload.thread) {
            throw new Error(createPayload.error ?? "Unable to create the thread.");
          }

          threadId = createPayload.thread.id;

          if (isMounted) {
            setThread(createPayload.thread);
          }
        }

        if (threadId) {
          const response = await fetch(`/api/hubs/threads/${threadId}`);
          const payload = (await response.json()) as {
            error?: string;
            thread?: SerializedHubThread;
          };

          if (!response.ok || !payload.thread) {
            throw new Error(payload.error ?? "Unable to load the thread.");
          }

          if (isMounted) {
            setThread(payload.thread);
          }
        }
      } catch (error) {
        showToast({
          title: "Thread unavailable",
          description: error instanceof Error ? error.message : "Unable to load the thread.",
          variant: "error",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadThread();

    return () => {
      isMounted = false;
    };
  }, [selectedMessage.id, selectedMessage.threadSummary?.threadId, showToast]);

  return (
    <aside className="flex h-full w-full max-w-[380px] shrink-0 flex-col border-l border-[rgb(var(--border))] bg-[rgba(var(--surface),0.92)] backdrop-blur-xl">
      <header className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Thread
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--foreground))]">
            {thread?.title ?? "Reply thread"}
          </h3>
        </div>
        <Button onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading thread...
          </div>
        ) : thread ? (
          <div className="space-y-4">
            <div className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.8)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--muted-foreground))]">
                Root message
              </p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--foreground))]">
                {thread.rootMessage.author.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--foreground))]">
                {thread.rootMessage.content}
              </p>
            </div>

            {thread.messages.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[rgb(var(--border))] p-4 text-sm text-[rgb(var(--muted-foreground))]">
                No replies yet. Start the thread.
              </div>
            ) : (
              thread.messages.map((message) => (
                <div
                  className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4"
                  key={message.id}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {message.author.name}
                    </p>
                    {message.isEdited ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
                        Edited
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--foreground))]">
                    {message.content}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {thread ? (
        <ChatInput
          disabled={false}
          onMessageCreated={(message) =>
            setThread((currentThread) =>
              currentThread
                ? {
                    ...currentThread,
                    messages: [...currentThread.messages, message],
                  }
                : currentThread,
            )
          }
          onTyping={() => undefined}
          placeholder="Reply in thread"
          routeId={routeId}
          serverId={serverId}
          threadId={thread.id}
        />
      ) : null}
    </aside>
  );
}
