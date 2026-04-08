"use client";

import { useEffect, useOptimistic, useRef, useState } from "react";

import {
  createCommentAction,
  createPostAction,
  toggleLikeAction,
  toggleSavePostAction,
} from "@/modules/global/actions/post.actions";
import type { SerializedPost } from "@/modules/global/lib/posts";
import { FeedComposer } from "@/modules/global/components/FeedComposer";
import { PostCard } from "@/modules/global/components/PostCard";

type FeedListProps = {
  initialCursor: string | null;
  initialPosts: SerializedPost[];
  viewer: {
    id: string;
    image: string | null;
    name: string;
    username: string | null;
  };
};

type OptimisticAction =
  | { type: "prepend"; post: SerializedPost }
  | { type: "merge"; post: SerializedPost }
  | { type: "toggle-like"; postId: string }
  | { type: "toggle-save"; postId: string }
  | {
      type: "add-comment";
      postId: string;
      comment: SerializedPost["comments"][number];
    };

function reconcilePosts(
  currentPosts: SerializedPost[],
  action: OptimisticAction,
): SerializedPost[] {
  switch (action.type) {
    case "prepend":
      return [action.post, ...currentPosts];
    case "merge":
      return currentPosts.map((post) =>
        post.id === action.post.id ? action.post : post,
      );
    case "toggle-like":
      return currentPosts.map((post) =>
        post.id === action.postId
          ? {
              ...post,
              isLikedByViewer: !post.isLikedByViewer,
              likeCount: post.likeCount + (post.isLikedByViewer ? -1 : 1),
            }
          : post,
      );
    case "toggle-save":
      return currentPosts.map((post) =>
        post.id === action.postId
          ? {
              ...post,
              isSavedByViewer: !post.isSavedByViewer,
              saveCount: post.saveCount + (post.isSavedByViewer ? -1 : 1),
            }
          : post,
      );
    case "add-comment":
      return currentPosts.map((post) =>
        post.id === action.postId
          ? {
              ...post,
              commentCount: post.commentCount + 1,
              comments: [action.comment, ...post.comments].slice(0, 3),
            }
          : post,
      );
    default:
      return currentPosts;
  }
}

export function FeedList({ initialCursor, initialPosts, viewer }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [optimisticPosts, applyOptimistic] = useOptimistic(posts, reconcilePosts);

  async function handleCreate(input: {
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    mediaName?: string | null;
  }) {
    const temporaryPost: SerializedPost = {
      id: `temp-${Date.now()}`,
      content: input.content,
      mediaUrl: input.mediaUrl ?? null,
      mediaType: input.mediaType ?? null,
      mediaName: input.mediaName ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      isLikedByViewer: false,
      isSavedByViewer: false,
      comments: [],
      author: viewer,
    };

    applyOptimistic({ type: "prepend", post: temporaryPost });

    try {
      const result = await createPostAction(input);
      const persistedPost = result.post;

      if (persistedPost) {
        setPosts((currentPosts) => [persistedPost, ...currentPosts]);
      }
    } catch (error) {
      setPosts((currentPosts) => [...currentPosts]);
      throw error;
    }
  }

  async function handleLike(postId: string) {
    applyOptimistic({ type: "toggle-like", postId });

    try {
      const result = await toggleLikeAction(postId);
      const updatedPost = result.post;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === postId ? updatedPost : post)),
        );
      }
    } catch {
      setPosts((currentPosts) => [...currentPosts]);
    }
  }

  async function handleSave(postId: string) {
    applyOptimistic({ type: "toggle-save", postId });

    try {
      const result = await toggleSavePostAction(postId);
      const updatedPost = result.post;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === postId ? updatedPost : post)),
        );
      }
    } catch {
      setPosts((currentPosts) => [...currentPosts]);
    }
  }

  async function handleComment(postId: string, text: string) {
    applyOptimistic({
      type: "add-comment",
      postId,
      comment: {
        id: `temp-comment-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        author: viewer,
      },
    });

    try {
      const result = await createCommentAction({ postId, text });
      const updatedPost = result.post;

      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === postId ? updatedPost : post)),
        );
      }
    } catch {
      setPosts((currentPosts) => [...currentPosts]);
    }
  }

  async function loadMorePosts() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/global/feed?cursor=${encodeURIComponent(nextCursor)}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        items?: SerializedPost[];
        nextCursor?: string | null;
      };

      if (!response.ok || !payload.items) {
        throw new Error(payload.error ?? "Unable to load more posts.");
      }

      const nextItems = payload.items;

      setPosts((currentPosts) => [...currentPosts, ...nextItems]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load more posts.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void loadMorePosts();
      }
    });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isLoadingMore, nextCursor]);

  return (
    <div className="space-y-6">
      <FeedComposer onCreate={handleCreate} />

      <div className="space-y-5">
        {optimisticPosts.map((post) => (
          <PostCard
            key={post.id}
            onComment={handleComment}
            onLike={handleLike}
            onSave={handleSave}
            post={post}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 py-4" ref={sentinelRef}>
        {isLoadingMore ? (
          <div className="w-full rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-center text-sm text-[rgb(var(--muted-foreground))]">
            Loading more posts...
          </div>
        ) : null}

        {!nextCursor ? (
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            You are caught up.
          </div>
        ) : null}

        {loadError ? (
          <div className="text-sm text-rose-300">{loadError}</div>
        ) : null}
      </div>
    </div>
  );
}
