"use client";

import { useEffect, useRef, useState } from "react";

import {
  archivePostAction,
  createCommentAction,
  createPostAction,
  deletePostAction,
  toggleBookmarkPostAction,
  toggleLikeAction,
  votePollAction,
} from "@/modules/global/actions/post.actions";
import type { FeedScope, SerializedPost, SerializedPostPreview } from "@/modules/global/lib/posts";
import { FeedComposer } from "@/modules/global/components/FeedComposer";
import { PostCard } from "@/modules/global/components/PostCard";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/components/ui/toast";

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

function replacePost(currentPosts: SerializedPost[], updatedPost: SerializedPost | null) {
  if (!updatedPost) {
    return currentPosts;
  }

  return currentPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post));
}

export function FeedList({ initialCursor, initialPosts, viewer }: FeedListProps) {
  const { showToast } = useToast();
  const [scope, setScope] = useState<FeedScope>("all");
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [isLoadingScope, setIsLoadingScope] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<SerializedPostPreview | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setNextCursor(initialCursor);
  }, [initialCursor, initialPosts]);

  async function fetchScope(nextScope: FeedScope) {
    setIsLoadingScope(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/global/feed?scope=${encodeURIComponent(nextScope)}`);
      const payload = (await response.json()) as {
        error?: string;
        items?: SerializedPost[];
        nextCursor?: string | null;
      };

      if (!response.ok || !payload.items) {
        throw new Error(payload.error ?? "Unable to load the selected feed.");
      }

      setScope(nextScope);
      setPosts(payload.items);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load the selected feed.",
      );
    } finally {
      setIsLoadingScope(false);
    }
  }

  async function handleCreate(input: {
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    mediaName?: string | null;
    quotePostId?: string | null;
    poll?: {
      question?: string | null;
      allowMultipleVotes?: boolean;
      options: string[];
    } | null;
  }) {
    const result = await createPostAction(input);
    const persistedPost = result.post;

    if (persistedPost && scope === "all") {
      setPosts((currentPosts) => [persistedPost, ...currentPosts]);
    }

    if (scope === "bookmarks") {
      await fetchScope("bookmarks");
    }
  }

  async function handleLike(postId: string) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLikedByViewer: !post.isLikedByViewer,
              likeCount: post.likeCount + (post.isLikedByViewer ? -1 : 1),
            }
          : post,
      ),
    );

    try {
      const result = await toggleLikeAction(postId);
      setPosts((currentPosts) => replacePost(currentPosts, result.post));
    } catch {
      await fetchScope(scope);
    }
  }

  async function handleBookmark(postId: string) {
    setPosts((currentPosts) =>
      currentPosts
        .map((post) =>
          post.id === postId
            ? {
                ...post,
                bookmarkCount:
                  post.bookmarkCount + (post.isBookmarkedByViewer ? -1 : 1),
                isBookmarkedByViewer: !post.isBookmarkedByViewer,
              }
            : post,
        )
        .filter((post) => (scope === "bookmarks" ? post.isBookmarkedByViewer : true)),
    );

    try {
      const result = await toggleBookmarkPostAction(postId);

      if (scope === "bookmarks" && result.post && !result.post.isBookmarkedByViewer) {
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
      } else {
        setPosts((currentPosts) => replacePost(currentPosts, result.post));
      }
    } catch {
      await fetchScope(scope);
    }
  }

  async function handleComment(postId: string, text: string) {
    const optimisticComment = {
      id: `temp-comment-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      author: viewer,
    };

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentCount: post.commentCount + 1,
              comments: [optimisticComment, ...post.comments].slice(0, 3),
            }
          : post,
      ),
    );

    try {
      const result = await createCommentAction({ postId, text });
      setPosts((currentPosts) => replacePost(currentPosts, result.post));
    } catch {
      await fetchScope(scope);
    }
  }

  async function handleArchive(postId: string) {
    const previousPosts = posts;
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));

    try {
      await archivePostAction(postId);
      showToast({
        title: "Post archived",
        description: "The post has been removed from the active feed.",
        variant: "success",
      });
    } catch (error) {
      setPosts(previousPosts);
      showToast({
        title: "Archive failed",
        description: error instanceof Error ? error.message : "Unable to archive the post.",
        variant: "error",
      });
    }
  }

  async function handleDelete(postId: string) {
    const previousPosts = posts;
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));

    try {
      await deletePostAction(postId);
      showToast({
        title: "Post deleted",
        description: "The post has been permanently removed.",
        variant: "success",
      });
    } catch (error) {
      setPosts(previousPosts);
      showToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete the post.",
        variant: "error",
      });
    }
  }

  async function handleVotePoll(pollId: string, optionIds: string[]) {
    try {
      const result = await votePollAction({ optionIds, pollId });
      setPosts((currentPosts) => replacePost(currentPosts, result.post));
    } catch (error) {
      showToast({
        title: "Poll vote failed",
        description: error instanceof Error ? error.message : "Unable to register your vote.",
        variant: "error",
      });
    }
  }

  async function loadMorePosts() {
    if (!nextCursor || isLoadingMore || isLoadingScope) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/global/feed?scope=${encodeURIComponent(scope)}&cursor=${encodeURIComponent(nextCursor)}`,
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
      setLoadError(error instanceof Error ? error.message : "Unable to load more posts.");
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
  }, [isLoadingMore, nextCursor, scope, isLoadingScope]);

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.7)] p-1">
        {([
          { label: "All posts", value: "all" },
          { label: "Bookmarks", value: "bookmarks" },
        ] as const).map((tab) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              scope === tab.value
                ? "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                : "text-[rgb(var(--muted-foreground))]"
            }`}
            key={tab.value}
            onClick={() => void fetchScope(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FeedComposer
        onClearQuote={() => setQuoteTarget(null)}
        onCreate={handleCreate}
        quoteTarget={quoteTarget}
      />

      {isLoadingScope ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.88)] p-5"
              key={index}
            >
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-[20px]" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              onArchive={handleArchive}
              onBookmark={handleBookmark}
              onComment={handleComment}
              onDelete={handleDelete}
              onLike={handleLike}
              onQuote={(quotedPost) => setQuoteTarget(quotedPost)}
              onVotePoll={handleVotePoll}
              post={post}
            />
          ))}
        </div>
      )}

      {!isLoadingScope && posts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[rgb(var(--border))] px-6 py-10 text-center">
          <p className="text-lg font-semibold text-[rgb(var(--foreground))]">
            {scope === "bookmarks" ? "No bookmarks yet" : "No posts yet"}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
            {scope === "bookmarks"
              ? "Bookmark posts to keep them close at hand."
              : "Start the conversation with your first update."}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-3 py-4" ref={sentinelRef}>
        {isLoadingMore ? (
          <div className="w-full space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.88)] p-5"
                key={index}
              >
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-[20px]" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!nextCursor && posts.length > 0 ? (
          <div className="text-sm text-[rgb(var(--muted-foreground))]">You are caught up.</div>
        ) : null}

        {loadError ? <div className="text-sm text-rose-300">{loadError}</div> : null}
      </div>
    </div>
  );
}
