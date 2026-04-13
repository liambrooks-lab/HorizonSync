import { db } from "@/shared/lib/db";

export const GLOBAL_FEED_PAGE_SIZE = 8;

export type SerializedComment = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
};

export type SerializedPostPreview = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaName: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
};

export type SerializedPollOption = {
  id: string;
  text: string;
  position: number;
  voteCount: number;
  percentage: number;
  hasVoted: boolean;
};

export type SerializedPoll = {
  id: string;
  question: string | null;
  allowMultipleVotes: boolean;
  expiresAt: string | null;
  totalVotes: number;
  options: SerializedPollOption[];
};

export type SerializedPost = SerializedPostPreview & {
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  isLikedByViewer: boolean;
  isBookmarkedByViewer: boolean;
  isArchived: boolean;
  canManage: boolean;
  quotePost: SerializedPostPreview | null;
  poll: SerializedPoll | null;
  comments: SerializedComment[];
};

export type FeedScope = "all" | "bookmarks";

function serializePostPreview(post: {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaName: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
  };
}): SerializedPostPreview {
  return {
    id: post.id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    mediaName: post.mediaName,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name ?? post.author.email ?? "Unknown user",
      image: post.author.image,
      username: post.author.username,
    },
  };
}

function serializePoll(
  poll: {
    id: string;
    question: string | null;
    allowMultipleVotes: boolean;
    expiresAt: Date | null;
    options: Array<{
      id: string;
      text: string;
      position: number;
      votes: Array<{
        id: string;
        userId: string;
      }>;
    }>;
  } | null,
  viewerId: string,
): SerializedPoll | null {
  if (!poll) {
    return null;
  }

  const totalVotes = poll.options.reduce((count, option) => count + option.votes.length, 0);

  return {
    id: poll.id,
    question: poll.question,
    allowMultipleVotes: poll.allowMultipleVotes,
    expiresAt: poll.expiresAt?.toISOString() ?? null,
    totalVotes,
    options: poll.options
      .sort((left, right) => left.position - right.position)
      .map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
        voteCount: option.votes.length,
        percentage: totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0,
        hasVoted: option.votes.some((vote) => vote.userId === viewerId),
      })),
  };
}

function serializePost(
  post: Awaited<ReturnType<typeof getFeedPostsRaw>>[number],
  viewerId: string,
): SerializedPost {
  return {
    ...serializePostPreview(post),
    updatedAt: post.updatedAt.toISOString(),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    bookmarkCount: post._count.bookmarks,
    isLikedByViewer: post.likes.some((like) => like.userId === viewerId),
    isBookmarkedByViewer: post.bookmarks.some((bookmark) => bookmark.userId === viewerId),
    isArchived: post.isArchived,
    canManage: post.authorId === viewerId,
    quotePost: post.quotedPost ? serializePostPreview(post.quotedPost) : null,
    poll: serializePoll(post.poll, viewerId),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        name: comment.author.name ?? comment.author.email ?? "Unknown user",
        image: comment.author.image,
        username: comment.author.username,
      },
    })),
  };
}

async function ensureSeedPosts(userId: string) {
  const existingPostCount = await db.post.count();

  if (existingPostCount > 0) {
    return;
  }

  await db.post.createMany({
    data: [
      {
        authorId: userId,
        content:
          "HorizonSync Global is live. This feed is where product notes, launch updates, and community signals flow together without forcing context switches.",
      },
      {
        authorId: userId,
        content:
          "Phase 5 is about parity: threads in Hubs, rich engagement in Global, and structured execution in My Space.",
      },
      {
        authorId: userId,
        content:
          "Private execution and public communication finally live in the same product rhythm.",
      },
    ],
  });
}

function buildFeedWhere(userId: string, scope: FeedScope) {
  if (scope === "bookmarks") {
    return {
      isArchived: false,
      bookmarks: {
        some: {
          userId,
        },
      },
    };
  }

  return {
    isArchived: false,
  };
}

async function getFeedPostsRaw(userId: string, cursor?: string | null, scope: FeedScope = "all") {
  await ensureSeedPosts(userId);

  return db.post.findMany({
    where: buildFeedWhere(userId, scope),
    take: GLOBAL_FEED_PAGE_SIZE,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          username: true,
        },
      },
      quotedPost: {
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          mediaType: true,
          mediaName: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
      },
      likes: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      bookmarks: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      poll: {
        include: {
          options: {
            include: {
              votes: {
                select: {
                  id: true,
                  userId: true,
                },
              },
            },
          },
        },
      },
      comments: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
          bookmarks: true,
        },
      },
    },
  });
}

async function getPostByIdRaw(postId: string, userId: string) {
  return db.post.findFirst({
    where: {
      id: postId,
      isArchived: false,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          username: true,
        },
      },
      quotedPost: {
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          mediaType: true,
          mediaName: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
      },
      likes: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      bookmarks: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      poll: {
        include: {
          options: {
            include: {
              votes: {
                select: {
                  id: true,
                  userId: true,
                },
              },
            },
          },
        },
      },
      comments: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
          bookmarks: true,
        },
      },
    },
  });
}

export async function getPaginatedFeedPosts(
  userId: string,
  cursor?: string | null,
  scope: FeedScope = "all",
) {
  const posts = await getFeedPostsRaw(userId, cursor, scope);

  return {
    items: posts.map((post) => serializePost(post, userId)),
    nextCursor:
      posts.length === GLOBAL_FEED_PAGE_SIZE ? posts[posts.length - 1]?.id ?? null : null,
  };
}

export async function getSerializedPostById(postId: string, userId: string) {
  const post = await getPostByIdRaw(postId, userId);

  if (!post) {
    return null;
  }

  return serializePost(post, userId);
}
