"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSerializedPostById } from "@/modules/global/lib/posts";
import { getCurrentUser } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import {
  sanitizeOptionalPlainText,
  sanitizeOptionalUrl,
  sanitizePlainText,
} from "@/shared/lib/security";

const createPostSchema = z.object({
  content: z.string().trim().max(2000).transform((value) => sanitizePlainText(value, 2000)),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.string().max(255).nullable().optional(),
  mediaName: z.string().max(255).nullable().optional(),
  quotePostId: z.string().cuid().nullable().optional(),
  poll: z
    .object({
      question: z.string().trim().max(280).nullable().optional(),
      allowMultipleVotes: z.boolean().optional(),
      options: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
    })
    .nullable()
    .optional(),
});

const commentSchema = z.object({
  postId: z.string().cuid(),
  text: z.string().trim().min(1).max(500).transform((value) => sanitizePlainText(value, 500)),
});

const pollVoteSchema = z.object({
  pollId: z.string().cuid(),
  optionIds: z.array(z.string().cuid()).min(1).max(4),
});

async function requireViewer() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be signed in to use the Global feed.");
  }

  return currentUser;
}

function revalidateGlobalFeed() {
  revalidatePath("/global");
}

export async function createPostAction(input: {
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
  const viewer = await requireViewer();
  const parsedInput = createPostSchema.parse(input);

  if (!parsedInput.content && !parsedInput.mediaUrl && !parsedInput.quotePostId && !parsedInput.poll) {
    throw new Error("A post must include text, media, a quote, or a poll.");
  }

  if (parsedInput.quotePostId) {
    const quotedPost = await db.post.findFirst({
      where: {
        id: parsedInput.quotePostId,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!quotedPost) {
      throw new Error("Quoted post not found.");
    }
  }

  const post = await db.post.create({
    data: {
      authorId: viewer.id,
      content: parsedInput.content,
      mediaUrl: sanitizeOptionalUrl(parsedInput.mediaUrl),
      mediaType: sanitizeOptionalPlainText(parsedInput.mediaType, 255),
      mediaName: sanitizeOptionalPlainText(parsedInput.mediaName, 255),
      quotePostId: parsedInput.quotePostId ?? null,
      poll: parsedInput.poll
        ? {
            create: {
              allowMultipleVotes: Boolean(parsedInput.poll.allowMultipleVotes),
              question: sanitizeOptionalPlainText(parsedInput.poll.question, 280),
              options: {
                create: parsedInput.poll.options.map((option, index) => ({
                  position: index,
                  text: sanitizePlainText(option, 120),
                })),
              },
            },
          }
        : undefined,
    },
  });

  revalidateGlobalFeed();

  return {
    post: await getSerializedPostById(post.id, viewer.id),
  };
}

export async function toggleLikeAction(postId: string) {
  const viewer = await requireViewer();

  const existingLike = await db.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: viewer.id,
      },
    },
  });

  if (existingLike) {
    await db.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    await db.like.create({
      data: {
        postId,
        userId: viewer.id,
      },
    });
  }

  revalidateGlobalFeed();

  return {
    post: await getSerializedPostById(postId, viewer.id),
  };
}

export async function toggleBookmarkPostAction(postId: string) {
  const viewer = await requireViewer();

  const existingBookmark = await db.bookmark.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: viewer.id,
      },
    },
  });

  if (existingBookmark) {
    await db.bookmark.delete({
      where: { id: existingBookmark.id },
    });
  } else {
    await db.bookmark.create({
      data: {
        postId,
        userId: viewer.id,
      },
    });
  }

  revalidateGlobalFeed();

  return {
    post: await getSerializedPostById(postId, viewer.id),
  };
}

export async function archivePostAction(postId: string) {
  const viewer = await requireViewer();

  const post = await db.post.findFirst({
    where: {
      id: postId,
      authorId: viewer.id,
    },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  await db.post.update({
    where: { id: post.id },
    data: { isArchived: true },
  });

  revalidateGlobalFeed();

  return { success: true };
}

export async function deletePostAction(postId: string) {
  const viewer = await requireViewer();

  const post = await db.post.findFirst({
    where: {
      id: postId,
      authorId: viewer.id,
    },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  await db.post.delete({
    where: { id: post.id },
  });

  revalidateGlobalFeed();

  return { success: true };
}

export async function createCommentAction(input: {
  postId: string;
  text: string;
}) {
  const viewer = await requireViewer();
  const parsedInput = commentSchema.parse(input);

  await db.comment.create({
    data: {
      postId: parsedInput.postId,
      text: parsedInput.text,
      authorId: viewer.id,
    },
  });

  revalidateGlobalFeed();

  return {
    post: await getSerializedPostById(parsedInput.postId, viewer.id),
  };
}

export async function votePollAction(input: {
  pollId: string;
  optionIds: string[];
}) {
  const viewer = await requireViewer();
  const parsedInput = pollVoteSchema.parse(input);

  const poll = await db.poll.findUnique({
    where: { id: parsedInput.pollId },
    include: {
      options: {
        select: {
          id: true,
        },
      },
      post: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!poll) {
    throw new Error("Poll not found.");
  }

  const allowedOptionIds = new Set(poll.options.map((option) => option.id));
  const uniqueOptionIds = Array.from(new Set(parsedInput.optionIds)).filter((optionId) =>
    allowedOptionIds.has(optionId),
  );

  if (uniqueOptionIds.length === 0) {
    throw new Error("Select at least one valid poll option.");
  }

  if (!poll.allowMultipleVotes && uniqueOptionIds.length > 1) {
    throw new Error("This poll accepts only one option.");
  }

  await db.$transaction(async (tx) => {
    const existingVotes = await tx.pollVote.findMany({
      where: {
        pollId: poll.id,
        userId: viewer.id,
      },
      select: { id: true },
    });

    if (existingVotes.length > 0) {
      await tx.pollVote.deleteMany({
        where: {
          id: {
            in: existingVotes.map((vote) => vote.id),
          },
        },
      });
    }

    await tx.pollVote.createMany({
      data: uniqueOptionIds.map((optionId) => ({
        optionId,
        pollId: poll.id,
        userId: viewer.id,
      })),
    });
  });

  revalidateGlobalFeed();

  return {
    post: await getSerializedPostById(poll.post.id, viewer.id),
  };
}
