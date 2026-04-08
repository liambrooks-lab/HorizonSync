"use client";

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

import type { SerializedPost } from "@/modules/global/lib/posts";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

type PostCardProps = {
  post: SerializedPost;
  onComment: (postId: string, text: string) => Promise<void>;
  onLike: (postId: string) => Promise<void>;
  onSave: (postId: string) => Promise<void>;
};

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostCard({ post, onComment, onLike, onSave }: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const isImage = Boolean(post.mediaUrl && post.mediaType?.startsWith("image/"));

  return (
    <article className="rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-[0_24px_80px_-54px_rgba(12,24,68,0.45)]">
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

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--foreground))]">
            {post.content}
          </p>

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
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          className={cn(post.isLikedByViewer && "text-rose-200")}
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
          className={cn(post.isSavedByViewer && "text-amber-200")}
          onClick={() => void onSave(post.id)}
          type="button"
          variant="ghost"
        >
          <Bookmark className={cn("mr-2 h-4 w-4", post.isSavedByViewer && "fill-current")} />
          {post.saveCount}
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
        className="mt-5 flex gap-3"
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
