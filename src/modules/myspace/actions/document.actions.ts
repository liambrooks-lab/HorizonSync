"use server";

import { revalidatePath } from "next/cache";
import { WorkspaceViewType } from "@prisma/client";
import { z } from "zod";

import {
  getWorkspaceDocument,
  type DocumentBlock,
} from "@/modules/myspace/lib/documents";
import { getCurrentUser } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import {
  sanitizeOptionalPlainText,
  sanitizeOptionalUrl,
  sanitizePlainText,
} from "@/shared/lib/security";

const documentUpdateSchema = z.object({
  documentId: z.string().cuid(),
  title: z.string().trim().min(1).max(160).transform((value) => sanitizePlainText(value, 160)),
  icon: z.string().trim().max(16).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  folderId: z.string().cuid().nullable().optional(),
  parentId: z.string().cuid().nullable().optional(),
  status: z.string().trim().max(60).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  content: z.array(z.any()),
});

const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(160).transform((value) => sanitizePlainText(value, 160)),
  folderId: z.string().cuid().nullable().optional(),
  parentId: z.string().cuid().nullable().optional(),
});

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(80).transform((value) => sanitizePlainText(value, 80)),
  color: z.string().trim().max(40).nullable().optional(),
});

const reminderSchema = z.object({
  documentId: z.string().cuid(),
  title: z.string().trim().min(1).max(160).transform((value) => sanitizePlainText(value, 160)),
  note: z.string().trim().max(600).nullable().optional(),
  remindAt: z.string().datetime(),
});

const moveDocumentSchema = z.object({
  documentId: z.string().cuid(),
  parentId: z.string().cuid().nullable().optional(),
  status: z.string().trim().max(60).nullable().optional(),
});

const workspaceViewSchema = z.object({
  viewId: z.string().cuid(),
  name: z.string().trim().min(1).max(80).transform((value) => sanitizePlainText(value, 80)),
  type: z.nativeEnum(WorkspaceViewType),
});

async function requireViewer() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("You must be signed in to use My Space.");
  }

  return currentUser;
}

function revalidateWorkspace(documentId?: string) {
  revalidatePath("/myspace");

  if (documentId) {
    revalidatePath(`/myspace/${documentId}`);
  }
}

export async function createDocumentAction(input: {
  title: string;
  folderId?: string | null;
  parentId?: string | null;
}) {
  const viewer = await requireViewer();
  const parsedInput = createDocumentSchema.parse(input);

  const siblingCount = await db.document.count({
    where: {
      folderId: parsedInput.folderId ?? null,
      parentId: parsedInput.parentId ?? null,
      userId: viewer.id,
    },
  });

  const document = await db.document.create({
    data: {
      title: parsedInput.title,
      folderId: parsedInput.folderId ?? null,
      parentId: parsedInput.parentId ?? null,
      userId: viewer.id,
      status: "Backlog",
      position: siblingCount,
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

  revalidateWorkspace(document.id);

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
      workspaceViews: {
        create: [
          { name: "List", position: 0, type: WorkspaceViewType.LIST, userId: viewer.id },
          { name: "Board", position: 1, type: WorkspaceViewType.KANBAN, userId: viewer.id },
          { name: "Calendar", position: 2, type: WorkspaceViewType.CALENDAR, userId: viewer.id },
        ],
      },
    },
    select: { id: true },
  });

  revalidateWorkspace();

  return { folderId: folder.id };
}

export async function updateDocumentAction(input: {
  documentId: string;
  title: string;
  icon?: string | null;
  coverImageUrl?: string | null;
  folderId?: string | null;
  parentId?: string | null;
  status?: string | null;
  dueDate?: string | null;
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
      icon: sanitizeOptionalPlainText(parsedInput.icon, 16),
      coverImageUrl: sanitizeOptionalUrl(parsedInput.coverImageUrl),
      folderId: parsedInput.folderId ?? null,
      parentId: parsedInput.parentId ?? null,
      status: sanitizeOptionalPlainText(parsedInput.status, 60),
      dueDate: parsedInput.dueDate ? new Date(parsedInput.dueDate) : null,
      content: JSON.stringify(parsedInput.content),
    },
  });

  revalidateWorkspace(parsedInput.documentId);

  return {
    document: await getWorkspaceDocument(parsedInput.documentId, viewer.id),
  };
}

export async function moveDocumentAction(input: {
  documentId: string;
  parentId?: string | null;
  status?: string | null;
}) {
  const viewer = await requireViewer();
  const parsedInput = moveDocumentSchema.parse(input);

  await db.document.updateMany({
    where: {
      id: parsedInput.documentId,
      userId: viewer.id,
    },
    data: {
      parentId: parsedInput.parentId ?? null,
      status: sanitizeOptionalPlainText(parsedInput.status, 60),
    },
  });

  revalidateWorkspace(parsedInput.documentId);

  return {
    document: await getWorkspaceDocument(parsedInput.documentId, viewer.id),
  };
}

export async function updateWorkspaceViewAction(input: {
  viewId: string;
  name: string;
  type: WorkspaceViewType;
}) {
  const viewer = await requireViewer();
  const parsedInput = workspaceViewSchema.parse(input);

  await db.workspaceView.updateMany({
    where: {
      id: parsedInput.viewId,
      userId: viewer.id,
    },
    data: {
      name: parsedInput.name,
      type: parsedInput.type,
    },
  });

  revalidateWorkspace();

  return { success: true };
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
      note: sanitizeOptionalPlainText(parsedInput.note, 600),
      remindAt: new Date(parsedInput.remindAt),
      title: parsedInput.title,
    },
  });

  revalidateWorkspace(parsedInput.documentId);

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

  revalidateWorkspace(input.documentId);

  return {
    document: await getWorkspaceDocument(input.documentId, viewer.id),
  };
}
