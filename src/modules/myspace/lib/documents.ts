import { db } from "@/shared/lib/db";

export type DocumentBlock =
  | {
      id: string;
      type: "paragraph";
      content: string;
    }
  | {
      id: string;
      type: "heading";
      content: string;
      level: 1 | 2 | 3;
    }
  | {
      id: string;
      type: "checklist";
      items: Array<{
        id: string;
        label: string;
        checked: boolean;
      }>;
    }
  | {
      id: string;
      type: "image";
      url: string;
      caption: string;
      fileName?: string;
    }
  | {
      id: string;
      type: "file";
      url: string;
      fileName: string;
      fileType?: string;
      fileSize?: number;
    };

export type SerializedWorkspaceDocument = {
  id: string;
  title: string;
  icon: string | null;
  folderId: string | null;
  updatedAt: string;
};

export type SerializedWorkspaceFolder = {
  id: string;
  name: string;
  color: string | null;
  documents: SerializedWorkspaceDocument[];
};

export type SerializedDocumentReminder = {
  id: string;
  title: string;
  note: string | null;
  remindAt: string;
  completed: boolean;
};

export type SerializedWorkspaceDocumentDetail = {
  id: string;
  title: string;
  icon: string | null;
  coverImageUrl: string | null;
  folderId: string | null;
  content: DocumentBlock[];
  reminders: SerializedDocumentReminder[];
  updatedAt: string;
};

const DEFAULT_DOCUMENT_BLOCKS: DocumentBlock[] = [
  {
    id: "heading-intro",
    type: "heading",
    level: 1,
    content: "Welcome to My Space",
  },
  {
    id: "paragraph-intro",
    type: "paragraph",
    content:
      "This is your private execution layer inside HorizonSync. Draft ideas, collect assets, and plan work before anything reaches the Global feed.",
  },
  {
    id: "checklist-launch",
    type: "checklist",
    items: [
      {
        id: "task-1",
        label: "Sketch the next document structure",
        checked: false,
      },
      {
        id: "task-2",
        label: "Drop image or file references into the editor",
        checked: false,
      },
    ],
  },
];

function stringifyBlocks(blocks: DocumentBlock[]) {
  return JSON.stringify(blocks);
}

export function parseDocumentBlocks(rawContent: string | null): DocumentBlock[] {
  if (!rawContent) {
    return DEFAULT_DOCUMENT_BLOCKS;
  }

  try {
    const parsed = JSON.parse(rawContent) as DocumentBlock[];
    return Array.isArray(parsed) ? parsed : DEFAULT_DOCUMENT_BLOCKS;
  } catch {
    return DEFAULT_DOCUMENT_BLOCKS;
  }
}

async function ensureWorkspace(userId: string) {
  const existingDocumentCount = await db.document.count({
    where: { userId },
  });

  if (existingDocumentCount > 0) {
    return;
  }

  const folder = await db.documentFolder.create({
    data: {
      name: "Planning",
      color: "blue",
      userId,
      position: 0,
    },
    select: { id: true },
  });

  await db.document.create({
    data: {
      title: "HorizonSync Workspace Brief",
      icon: "🧭",
      folderId: folder.id,
      userId,
      content: stringifyBlocks(DEFAULT_DOCUMENT_BLOCKS),
    },
  });
}

export async function getMySpaceWorkspace(userId: string) {
  await ensureWorkspace(userId);

  const [folders, looseDocuments] = await Promise.all([
    db.documentFolder.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        documents: {
          where: { isArchived: false },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            icon: true,
            folderId: true,
            updatedAt: true,
          },
        },
      },
    }),
    db.document.findMany({
      where: {
        userId,
        folderId: null,
        isArchived: false,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        icon: true,
        folderId: true,
        updatedAt: true,
      },
    }),
  ]);

  const serializedFolders: SerializedWorkspaceFolder[] = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    color: folder.color,
    documents: folder.documents.map((document) => ({
      id: document.id,
      title: document.title,
      icon: document.icon,
      folderId: document.folderId,
      updatedAt: document.updatedAt.toISOString(),
    })),
  }));

  const inboxFolder: SerializedWorkspaceFolder = {
    id: "unfiled",
    name: "Unfiled",
    color: "slate",
    documents: looseDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      icon: document.icon,
      folderId: document.folderId,
      updatedAt: document.updatedAt.toISOString(),
    })),
  };

  return {
    folders: inboxFolder.documents.length > 0 ? [...serializedFolders, inboxFolder] : serializedFolders,
  };
}

export async function getWorkspaceDocument(documentId: string, userId: string) {
  await ensureWorkspace(userId);

  const document = await db.document.findFirst({
    where: {
      id: documentId,
      userId,
      isArchived: false,
    },
    include: {
      reminders: {
        orderBy: { remindAt: "asc" },
      },
    },
  });

  if (!document) {
    return null;
  }

  return {
    id: document.id,
    title: document.title,
    icon: document.icon,
    coverImageUrl: document.coverImageUrl,
    folderId: document.folderId,
    content: parseDocumentBlocks(document.content),
    reminders: document.reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      note: reminder.note,
      remindAt: reminder.remindAt.toISOString(),
      completed: reminder.completed,
    })),
    updatedAt: document.updatedAt.toISOString(),
  } satisfies SerializedWorkspaceDocumentDetail;
}
