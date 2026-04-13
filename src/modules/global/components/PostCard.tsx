"use client";

import {
  Archive,
  Bookmark,
  Heart,
  MessageCircle,
  Quote,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import type { SerializedPost } from "@/modules/global/lib/posts";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

type PostCardProps = {
  onArchive: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<void>;
  onComment: (postId: string, text: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  onLike: (postId: string) => Promise<void>;
  onQuote: (post: SerializedPost) => void;
  onVotePoll: (pollId: string, optionIds: string[]) => Promise<void>;
  post: SerializedPost;
};

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PollCard({
  onVote,
  post,
}: {
  onVote: (pollId: string, optionIds: string[]) => Promise<void>;
  post: SerializedPost;
}) {
  const poll = post.poll;
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    poll?.options.filter((option) => option.hasVoted).map((option) => option.id) ?? [],
  );
  const [isVoting, setIsVoting] = useState(false);

  if (!poll) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.78)] p-4">
      {poll.question ? (
        <p className="text-sm font-semibold text-[rgb(var(--foreground))]">{poll.question}</p>
      ) : null}

      <div className="mt-3 space-y-3">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <button
              className={cn(
                "relative w-full overflow-hidden rounded-[20px] border px-4 py-3 text-left",
                isSelected
                  ? "border-[rgb(var(--accent-strong))] text-[rgb(var(--foreground))]"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))]",
              )}
              key={option.id}
              onClick={() => {
                setSelectedOptions((currentOptions) => {
                  if (poll.allowMultipleVotes) {
                    return currentOptions.includes(option.id)
                      ? currentOptions.filter((currentOptionId) => currentOptionId !== option.id)
                      : [...currentOptions, option.id];
                  }

                  return [option.id];
                });
              }}
              type="button"
            >
              <div
                className="absolute inset-y-0 left-0 bg-[rgba(var(--accent-strong),0.16)]"
                style={{ width: `${option.percentage}%` }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{option.text}</span>
                <span className="text-xs font-semibold">
                  {option.voteCount} votes · {option.percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
          {poll.totalVotes} total votes
        </p>
        <Button
          disabled={selectedOptions.length === 0 || isVoting}
          onClick={async () => {
            setIsVoting(true);
            try {
              await onVote(poll.id, selectedOptions);
            } finally {
              setIsVoting(false);
            }
          }}
          type="button"
          variant="secondary"
        >
          Vote
        </Button>
      </div>
    </div>
  );
}

export function PostCard({
  onArchive,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  onQuote,
  onVotePoll,
  post,
}: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const isImage = Boolean(post.mediaUrl && post.mediaType?.startsWith("image/"));

  return (
    <article className="panel-surface rounded-[30px] border border-[rgb(var(--border))] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        {post.author.image ? (
          <img
            alt={post.author.name}
            className="h-12 w-12 rounded-[20px] object-cover"
            src={post.author.image}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[rgb(var(--surface-elevated))] text-sm font-semibold text-[rgb(var(--foreground))]">
            {post.author.name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                {post.author.name}
              </p>
              {post.author.username ? (
                <span className="text-xs text-[rgb(var(--accent-strong))]">
                  @{post.author.username}
                </span>
              ) : null}
              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                {formatTimestamp(post.createdAt)}
              </span>
            </div>

            {post.canManage ? (
              <div className="flex items-center gap-2">
                <Button onClick={() => void onArchive(post.id)} size="sm" variant="ghost">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
                <Button onClick={() => void onDelete(post.id)} size="sm" variant="ghost">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--foreground))]">
            {post.content}
          </p>

          {post.quotePost ? (
            <div className="mt-4 rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.72)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
                Quoted
              </p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--foreground))]">
                {post.quotePost.author.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {post.quotePost.content}
              </p>
            </div>
          ) : null}

          {post.mediaUrl ? (
            isImage ? (
              <a
                className="mt-4 block overflow-hidden rounded-[24px] border border-[rgb(var(--border))]"
                href={post.mediaUrl}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt={post.mediaName ?? "Post media"}
                  className="max-h-[420px] w-full object-cover"
                  src={post.mediaUrl}
                />
              </a>
            ) : (
              <a
                className="mt-4 block rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-4 text-sm text-[rgb(var(--foreground))]"
                href={post.mediaUrl}
                rel="noreferrer"
                target="_blank"
              >
                {post.mediaName ?? "Open attachment"}
              </a>
            )
          ) : null}

          <PollCard onVote={onVotePoll} post={post} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          className={cn(post.isLikedByViewer && "text-rose-300")}
          onClick={() => void onLike(post.id)}
          type="button"
          variant="ghost"
        >
          <Heart className={cn("mr-2 h-4 w-4", post.isLikedByViewer && "fill-current")} />
          {post.likeCount}
        </Button>
        <Button type="button" variant="ghost">
          <MessageCircle className="mr-2 h-4 w-4" />
          {post.commentCount}
        </Button>
        <Button
          className={cn(post.isBookmarkedByViewer && "text-amber-200")}
          onClick={() => void onBookmark(post.id)}
          type="button"
          variant="ghost"
        >
          <Bookmark
            className={cn("mr-2 h-4 w-4", post.isBookmarkedByViewer && "fill-current")}
          />
          {post.bookmarkCount}
        </Button>
        <Button onClick={() => onQuote(post)} type="button" variant="ghost">
          <Quote className="mr-2 h-4 w-4" />
          Quote
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {post.comments.map((comment) => (
          <div
            className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-3"
            key={comment.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[rgb(var(--foreground))]">
                {comment.author.name}
              </span>
              {comment.author.username ? (
                <span className="text-xs text-[rgb(var(--accent-strong))]">
                  @{comment.author.username}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--foreground))]">
              {comment.text}
            </p>
          </div>
        ))}
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!commentText.trim()) {
            return;
          }

          setIsCommenting(true);
          await onComment(post.id, commentText);
          setCommentText("");
          setIsCommenting(false);
        }}
      >
        <Input
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Add a comment"
          value={commentText}
        />
        <Button disabled={isCommenting || !commentText.trim()} type="submit">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </article>
  );
}
