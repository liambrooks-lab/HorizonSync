"use client";

import {
  Download,
  FileText,
  Forward,
  MessageCircleReply,
  Pencil,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import type { SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

type MessageListProps = {
  currentMemberId: string;
  messages: SerializedHubMessage[];
  onDeleteMessage: (messageId: string) => Promise<void>;
  onForwardMessage: (messageId: string) => Promise<void>;
  onOpenThread: (message: SerializedHubMessage) => Promise<void>;
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>;
  onUpdateMessage: (messageId: string, content: string) => Promise<void>;
  typingUsers: string[];
};

const QUICK_REACTIONS = ["👍", "🔥", "🎯", "👏", "💡", "🚀"];

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
  onDeleteMessage,
  onForwardMessage,
  onOpenThread,
  onReactToMessage,
  onUpdateMessage,
  typingUsers,
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
              No messages yet
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
              Start the conversation. New messages, threads, and reactions will appear here.
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
            const isEditing = editingMessageId === message.id;

            return (
              <article
                className={cn(
                  "group relative flex gap-3 rounded-[24px] border p-4",
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
                    {message.isEdited && !message.deleted ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
                        Edited
                      </span>
                    ) : null}
                  </div>

                  {message.forwardedFrom ? (
                    <div className="mt-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.68)] px-3 py-2 text-xs text-[rgb(var(--muted-foreground))]">
                      Forwarded from {message.forwardedFrom.authorName}: {message.forwardedFrom.content}
                    </div>
                  ) : null}

                  {isEditing ? (
                    <form
                      className="mt-3 flex flex-col gap-3 sm:flex-row"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!draftContent.trim()) {
                          return;
                        }
                        await onUpdateMessage(message.id, draftContent);
                        setEditingMessageId(null);
                        setDraftContent("");
                      }}
                    >
                      <Input
                        onChange={(event) => setDraftContent(event.target.value)}
                        value={draftContent}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" type="submit">
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingMessageId(null);
                            setDraftContent("");
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : message.content ? (
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

                  {message.reactions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.reactions.map((reaction) => (
                        <button
                          className={cn(
                            "rounded-full border px-3 py-1 text-sm",
                            reaction.reactedByViewer
                              ? "border-[rgb(var(--accent-strong))] bg-[rgba(var(--accent-strong),0.12)] text-[rgb(var(--foreground))]"
                              : "border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))]",
                          )}
                          key={reaction.emoji}
                          onClick={() => void onReactToMessage(message.id, reaction.emoji)}
                          type="button"
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {message.threadSummary ? (
                    <button
                      className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent-strong))]"
                      onClick={() => void onOpenThread(message)}
                      type="button"
                    >
                      {message.threadSummary.replyCount} replies in thread
                    </button>
                  ) : null}

                  {reactionPickerFor === message.id ? (
                    <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.74)] p-3">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          className="rounded-xl px-3 py-2 text-lg hover:bg-[rgb(var(--surface))]"
                          key={emoji}
                          onClick={async () => {
                            setReactionPickerFor(null);
                            await onReactToMessage(message.id, emoji);
                          }}
                          type="button"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.96)] p-1 opacity-0 shadow-[0_18px_50px_-30px_rgba(3,8,20,0.8)] transition group-hover:opacity-100">
                  <Button
                    onClick={() => setReactionPickerFor((currentValue) => (currentValue === message.id ? null : message.id))}
                    size="icon"
                    variant="ghost"
                  >
                    <SmilePlus className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => void onOpenThread(message)} size="icon" variant="ghost">
                    <MessageCircleReply className="h-4 w-4" />
                  </Button>
                  {isOwnMessage ? (
                    <Button
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setDraftContent(message.deleted ? "" : message.content);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button onClick={() => void onForwardMessage(message.id)} size="icon" variant="ghost">
                    <Forward className="h-4 w-4" />
                  </Button>
                  {isOwnMessage ? (
                    <Button onClick={() => void onDeleteMessage(message.id)} size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
