"use client";

import { Download, FileText } from "lucide-react";

import type { SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { cn } from "@/shared/lib/utils";

type MessageListProps = {
  currentMemberId: string;
  messages: SerializedHubMessage[];
  typingUsers: string[];
};

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size: number | null) {
  if (!size) {
    return "Attachment";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageList({
  currentMemberId,
  messages,
  typingUsers,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
              No messages yet
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
              Start the conversation. New messages, typing indicators, and presence updates will
              appear here in real time.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.author.memberId === currentMemberId;
            const isImageAttachment = Boolean(
              message.fileUrl && message.fileType?.startsWith("image/"),
            );

            return (
              <article
                className={cn(
                  "flex gap-3 rounded-[24px] border p-4",
                  isOwnMessage
                    ? "border-[rgb(var(--accent-strong))/0.25] bg-[rgb(var(--accent-strong))/0.08]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))]",
                )}
                key={message.id}
              >
                {message.author.image ? (
                  <img
                    alt={message.author.name}
                    className="h-10 w-10 rounded-2xl object-cover"
                    src={message.author.image}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--surface-elevated))] text-sm font-semibold text-[rgb(var(--foreground))]">
                    {message.author.name.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {message.author.name}
                    </p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
                      {message.author.role}
                    </span>
                    <span className="text-xs text-[rgb(var(--muted-foreground))]">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>

                  {message.content ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--foreground))]">
                      {message.content}
                    </p>
                  ) : null}

                  {message.fileUrl ? (
                    isImageAttachment ? (
                      <a
                        className="mt-3 block overflow-hidden rounded-[22px] border border-[rgb(var(--border))]"
                        href={message.fileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <img
                          alt={message.fileName ?? "Shared image"}
                          className="max-h-[320px] w-full object-cover"
                          src={message.fileUrl}
                        />
                      </a>
                    ) : (
                      <a
                        className="mt-3 flex items-center justify-between rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-3"
                        href={message.fileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--surface))] text-[rgb(var(--accent-strong))]">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
                              {message.fileName ?? "Attachment"}
                            </p>
                            <p className="text-xs text-[rgb(var(--muted-foreground))]">
                              {formatFileSize(message.fileSize)}
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 shrink-0 text-[rgb(var(--muted-foreground))]" />
                      </a>
                    )
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {typingUsers.length > 0 ? (
        <div className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      ) : null}
    </div>
  );
}
