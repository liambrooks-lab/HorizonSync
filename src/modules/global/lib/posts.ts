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

export type SerializedPost = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaName: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  isLikedByViewer: boolean;
  isSavedByViewer: boolean;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
  comments: SerializedComment[];
};

function serializePost(
  post: Awaited<ReturnType<typeof getFeedPostsRaw>>[number],
  viewerId: string,
): SerializedPost {
  return {
    id: post.id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    mediaName: post.mediaName,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    saveCount: post._count.saves,
    isLikedByViewer: post.likes.some((like) => like.userId === viewerId),
    isSavedByViewer: post.saves.some((save) => save.userId === viewerId),
    author: {
      id: post.author.id,
      name: post.author.name ?? post.author.email ?? "Unknown user",
      image: post.author.image,
      username: post.author.username,
    },
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
          "Phase 3 is shaping the social, productivity, and AI layers into one connected workspace. Infinite scroll, saves, and comments are now part of the platform foundation.",
      },
      {
        authorId: userId,
        content:
          "My Space drafts can be promoted into the Global feed later, which means private execution and public communication finally live in the same product rhythm.",
      },
    ],
  });
}

async function getFeedPostsRaw(userId: string, cursor?: string | null) {
  await ensureSeedPosts(userId);

  return db.post.findMany({
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
      likes: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      saves: {
        where: { userId },
        select: {
          id: true,
          userId: true,
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
          saves: true,
        },
      },
    },
  });
}

async function getPostByIdRaw(postId: string, userId: string) {
  return db.post.findUnique({
    where: { id: postId },
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
      likes: {
        where: { userId },
        select: {
          id: true,
          userId: true,
        },
      },
      saves: {
        where: { userId },
        select: {
          id: true,
          userId: true,
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
          saves: true,
        },
      },
    },
  });
}

export async function getPaginatedFeedPosts(userId: string, cursor?: string | null) {
  const posts = await getFeedPostsRaw(userId, cursor);

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
