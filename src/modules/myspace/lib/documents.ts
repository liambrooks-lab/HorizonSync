import { WorkspaceViewType } from "@prisma/client";

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

export type SerializedWorkspaceView = {
  id: string;
  name: string;
  position: number;
  type: WorkspaceViewType;
};

export type SerializedWorkspaceDocument = {
  id: string;
  title: string;
  icon: string | null;
  folderId: string | null;
  parentId: string | null;
  status: string | null;
  dueDate: string | null;
  updatedAt: string;
  children: SerializedWorkspaceDocument[];
};

export type SerializedWorkspaceFolder = {
  id: string;
  name: string;
  color: string | null;
  documents: SerializedWorkspaceDocument[];
  views: SerializedWorkspaceView[];
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
  parentId: string | null;
  status: string | null;
  dueDate: string | null;
  content: DocumentBlock[];
  reminders: SerializedDocumentReminder[];
  updatedAt: string;
  folderDocuments: SerializedWorkspaceDocument[];
  folderViews: SerializedWorkspaceView[];
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

function buildDocumentTree(
  documents: Array<{
    id: string;
    title: string;
    icon: string | null;
    folderId: string | null;
    parentId: string | null;
    status: string | null;
    dueDate: Date | null;
    updatedAt: Date;
    position: number;
  }>,
  parentId: string | null = null,
): SerializedWorkspaceDocument[] {
  return documents
    .filter((document) => document.parentId === parentId)
    .sort((left, right) => left.position - right.position || right.updatedAt.getTime() - left.updatedAt.getTime())
    .map((document) => ({
      id: document.id,
      title: document.title,
      icon: document.icon,
      folderId: document.folderId,
      parentId: document.parentId,
      status: document.status,
      dueDate: document.dueDate?.toISOString() ?? null,
      updatedAt: document.updatedAt.toISOString(),
      children: buildDocumentTree(documents, document.id),
    }));
}

const DEFAULT_WORKSPACE_VIEWS: Array<{
  name: string;
  type: WorkspaceViewType;
}> = [
  { name: "List", type: WorkspaceViewType.LIST },
  { name: "Board", type: WorkspaceViewType.KANBAN },
  { name: "Calendar", type: WorkspaceViewType.CALENDAR },
];

async function ensureWorkspace(userId: string) {
  const existingDocumentCount = await db.document.count({
    where: { userId },
  });

  if (existingDocumentCount > 0) {
    const foldersWithoutViews = await db.documentFolder.findMany({
      where: {
        userId,
        workspaceViews: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      foldersWithoutViews.map((folder) =>
        db.workspaceView.createMany({
          data: DEFAULT_WORKSPACE_VIEWS.map((view, index) => ({
            folderId: folder.id,
            name: view.name,
            position: index,
            type: view.type,
            userId,
          })),
        }),
      ),
    );

    return;
  }

  const folder = await db.documentFolder.create({
    data: {
      name: "Planning",
      color: "blue",
      userId,
      position: 0,
      workspaceViews: {
        create: DEFAULT_WORKSPACE_VIEWS.map((view, index) => ({
          name: view.name,
          position: index,
          type: view.type,
          userId,
        })),
      },
    },
    select: { id: true },
  });

  await db.document.create({
    data: {
      title: "HorizonSync Workspace Brief",
      icon: "HS",
      folderId: folder.id,
      userId,
      content: stringifyBlocks(DEFAULT_DOCUMENT_BLOCKS),
      position: 0,
      status: "Backlog",
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
          orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            icon: true,
            folderId: true,
            parentId: true,
            status: true,
            dueDate: true,
            updatedAt: true,
            position: true,
          },
        },
        workspaceViews: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            name: true,
            position: true,
            type: true,
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
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        icon: true,
        folderId: true,
        parentId: true,
        status: true,
        dueDate: true,
        updatedAt: true,
        position: true,
      },
    }),
  ]);

  const serializedFolders: SerializedWorkspaceFolder[] = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    color: folder.color,
    documents: buildDocumentTree(folder.documents),
    views: folder.workspaceViews,
  }));

  const inboxFolder: SerializedWorkspaceFolder = {
    id: "unfiled",
    name: "Unfiled",
    color: "slate",
    documents: buildDocumentTree(looseDocuments),
    views: [],
  };

  return {
    folders:
      inboxFolder.documents.length > 0 ? [...serializedFolders, inboxFolder] : serializedFolders,
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
      folder: {
        include: {
          documents: {
            where: {
              isArchived: false,
            },
            orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              title: true,
              icon: true,
              folderId: true,
              parentId: true,
              status: true,
              dueDate: true,
              updatedAt: true,
              position: true,
            },
          },
          workspaceViews: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              name: true,
              position: true,
              type: true,
            },
          },
        },
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
    parentId: document.parentId,
    status: document.status,
    dueDate: document.dueDate?.toISOString() ?? null,
    content: parseDocumentBlocks(document.content),
    reminders: document.reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      note: reminder.note,
      remindAt: reminder.remindAt.toISOString(),
      completed: reminder.completed,
    })),
    updatedAt: document.updatedAt.toISOString(),
    folderDocuments: document.folder ? buildDocumentTree(document.folder.documents) : [],
    folderViews: document.folder?.workspaceViews ?? [],
  } satisfies SerializedWorkspaceDocumentDetail;
}
