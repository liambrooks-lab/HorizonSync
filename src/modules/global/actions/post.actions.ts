"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSerializedPostById } from "@/modules/global/lib/posts";
import { getCurrentUser } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

const createPostSchema = z.object({
  content: z.string().trim().max(2000),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.string().max(255).nullable().optional(),
  mediaName: z.string().max(255).nullable().optional(),
});

const commentSchema = z.object({
  postId: z.string().cuid(),
  text: z.string().trim().min(1).max(500),
});

async function requireViewer() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be signed in to use the Global feed.");
  }

  return currentUser;
}

export async function createPostAction(input: {
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
}) {
  const viewer = await requireViewer();
  const parsedInput = createPostSchema.parse(input);

  if (!parsedInput.content && !parsedInput.mediaUrl) {
    throw new Error("A post must include text or media.");
  }

  const post = await db.post.create({
    data: {
      authorId: viewer.id,
      content: parsedInput.content,
      mediaUrl: parsedInput.mediaUrl ?? null,
      mediaType: parsedInput.mediaType ?? null,
      mediaName: parsedInput.mediaName ?? null,
    },
  });

  revalidatePath("/global");

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

  revalidatePath("/global");

  return {
    post: await getSerializedPostById(postId, viewer.id),
  };
}

export async function toggleSavePostAction(postId: string) {
  const viewer = await requireViewer();

  const existingSave = await db.savedPost.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: viewer.id,
      },
    },
  });

  if (existingSave) {
    await db.savedPost.delete({
      where: { id: existingSave.id },
    });
  } else {
    await db.savedPost.create({
      data: {
        postId,
        userId: viewer.id,
      },
    });
  }

  revalidatePath("/global");

  return {
    post: await getSerializedPostById(postId, viewer.id),
  };
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

  revalidatePath("/global");

  return {
    post: await getSerializedPostById(parsedInput.postId, viewer.id),
  };
}
