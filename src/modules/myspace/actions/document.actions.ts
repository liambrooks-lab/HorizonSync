"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getWorkspaceDocument,
  type DocumentBlock,
} from "@/modules/myspace/lib/documents";
import { getCurrentUser } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

const documentUpdateSchema = z.object({
  documentId: z.string().cuid(),
  title: z.string().trim().min(1).max(160),
  icon: z.string().trim().max(16).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  folderId: z.string().cuid().nullable().optional(),
  content: z.array(z.any()),
});

const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  folderId: z.string().cuid().nullable().optional(),
});

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().max(40).nullable().optional(),
});

const reminderSchema = z.object({
  documentId: z.string().cuid(),
  title: z.string().trim().min(1).max(160),
  note: z.string().trim().max(600).nullable().optional(),
  remindAt: z.string().datetime(),
});

async function requireViewer() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be signed in to use My Space.");
  }

  return currentUser;
}

export async function createDocumentAction(input: {
  title: string;
  folderId?: string | null;
}) {
  const viewer = await requireViewer();
  const parsedInput = createDocumentSchema.parse(input);

  const document = await db.document.create({
    data: {
      title: parsedInput.title,
      folderId: parsedInput.folderId ?? null,
      userId: viewer.id,
      content: JSON.stringify([
        {
          id: "block-1",
          type: "paragraph",
          content: "",
        } satisfies DocumentBlock,
      ]),
    },
    select: { id: true },
  });

  revalidatePath("/myspace");

  return { documentId: document.id };
}

export async function createFolderAction(input: {
  name: string;
  color?: string | null;
}) {
  const viewer = await requireViewer();
  const parsedInput = createFolderSchema.parse(input);
  const folderCount = await db.documentFolder.count({
    where: { userId: viewer.id },
  });

  const folder = await db.documentFolder.create({
    data: {
      color: parsedInput.color ?? null,
      name: parsedInput.name,
      position: folderCount,
      userId: viewer.id,
    },
    select: { id: true },
  });

  revalidatePath("/myspace");

  return { folderId: folder.id };
}

export async function updateDocumentAction(input: {
  documentId: string;
  title: string;
  icon?: string | null;
  coverImageUrl?: string | null;
  folderId?: string | null;
  content: DocumentBlock[];
}) {
  const viewer = await requireViewer();
  const parsedInput = documentUpdateSchema.parse(input);

  await db.document.updateMany({
    where: {
      id: parsedInput.documentId,
      userId: viewer.id,
    },
    data: {
      title: parsedInput.title,
      icon: parsedInput.icon ?? null,
      coverImageUrl: parsedInput.coverImageUrl ?? null,
      folderId: parsedInput.folderId ?? null,
      content: JSON.stringify(parsedInput.content),
    },
  });

  revalidatePath("/myspace");
  revalidatePath(`/myspace/${parsedInput.documentId}`);

  return {
    document: await getWorkspaceDocument(parsedInput.documentId, viewer.id),
  };
}

export async function createReminderAction(input: {
  documentId: string;
  title: string;
  note?: string | null;
  remindAt: string;
}) {
  const viewer = await requireViewer();
  const parsedInput = reminderSchema.parse(input);

  const document = await db.document.findFirst({
    where: {
      id: parsedInput.documentId,
      userId: viewer.id,
    },
    select: { id: true },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  await db.documentReminder.create({
    data: {
      documentId: parsedInput.documentId,
      note: parsedInput.note ?? null,
      remindAt: new Date(parsedInput.remindAt),
      title: parsedInput.title,
    },
  });

  revalidatePath("/myspace");
  revalidatePath(`/myspace/${parsedInput.documentId}`);

  return {
    document: await getWorkspaceDocument(parsedInput.documentId, viewer.id),
  };
}

export async function toggleReminderAction(input: {
  reminderId: string;
  completed: boolean;
  documentId: string;
}) {
  const viewer = await requireViewer();

  const reminder = await db.documentReminder.findFirst({
    where: {
      id: input.reminderId,
      document: {
        userId: viewer.id,
      },
    },
    select: { id: true },
  });

  if (!reminder) {
    throw new Error("Reminder not found.");
  }

  await db.documentReminder.update({
    where: { id: reminder.id },
    data: { completed: input.completed },
  });

  revalidatePath(`/myspace/${input.documentId}`);

  return {
    document: await getWorkspaceDocument(input.documentId, viewer.id),
  };
}
