"use client";

import { ChevronDown, ChevronRight, FilePlus2, FolderPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createDocumentAction,
  createFolderAction,
} from "@/modules/myspace/actions/document.actions";
import type {
  SerializedWorkspaceDocument,
  SerializedWorkspaceFolder,
} from "@/modules/myspace/lib/documents";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

type MySpaceSidebarProps = {
  className?: string;
  folders: SerializedWorkspaceFolder[];
  onNavigate?: () => void;
};

type DocumentTreeNodeProps = {
  depth?: number;
  document: SerializedWorkspaceDocument;
  onNavigate?: () => void;
  openMap: Record<string, boolean>;
  pathname: string;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

function DocumentTreeNode({
  depth = 0,
  document,
  onNavigate,
  openMap,
  pathname,
  setOpenMap,
}: DocumentTreeNodeProps) {
  const isActive = pathname === `/myspace/${document.id}`;
  const hasChildren = document.children.length > 0;
  const isOpen = openMap[document.id] ?? true;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
          isActive
            ? "bg-[rgb(var(--accent-strong))] text-white"
            : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))] hover:text-[rgb(var(--foreground))]",
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {hasChildren ? (
          <button
            className="rounded-lg p-1 hover:bg-[rgba(var(--surface),0.72)]"
            onClick={() =>
              setOpenMap((currentMap) => ({
                ...currentMap,
                [document.id]: !isOpen,
              }))
            }
            type="button"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/myspace/${document.id}`} onClick={onNavigate}>
          <span>{document.icon ?? "DOC"}</span>
          <span className="truncate">{document.title}</span>
        </Link>
      </div>

      {hasChildren && isOpen ? (
        <div className="mt-1 space-y-1">
          {document.children.map((childDocument) => (
            <DocumentTreeNode
              depth={depth + 1}
              document={childDocument}
              key={childDocument.id}
              onNavigate={onNavigate}
              openMap={openMap}
              pathname={pathname}
              setOpenMap={setOpenMap}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MySpaceSidebar({
  className,
  folders,
  onNavigate,
}: MySpaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(folders[0]?.id ?? null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) ?? folders[0] ?? null,
    [activeFolderId, folders],
  );

  return (
    <aside
      className={cn(
        "flex w-[320px] shrink-0 flex-col border-r border-[rgb(var(--border))] bg-[rgba(var(--surface),0.82)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="border-b border-[rgb(var(--border))] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
          My Space
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--foreground))]">
          Documents
        </h2>
      </div>

      <div className="space-y-4 border-b border-[rgb(var(--border))] px-5 py-5">
        <div className="flex gap-2">
          <Input
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="New folder"
            value={folderName}
          />
          <Button
            onClick={async () => {
              if (!folderName.trim()) {
                return;
              }

              await createFolderAction({ name: folderName, color: "blue" });
              setFolderName("");
              router.refresh();
            }}
            size="icon"
            type="button"
            variant="secondary"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="New document"
            value={documentName}
          />
          <Button
            onClick={async () => {
              if (!documentName.trim()) {
                return;
              }

              const result = await createDocumentAction({
                title: documentName,
                folderId: activeFolder?.id === "unfiled" ? null : activeFolder?.id ?? null,
              });
              setDocumentName("");
              router.push(`/myspace/${result.documentId}`);
              router.refresh();
              onNavigate?.();
            }}
            size="icon"
            type="button"
          >
            <FilePlus2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-[rgb(var(--border))] px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => (
            <button
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
                activeFolderId === folder.id
                  ? "bg-[rgb(var(--surface-elevated))] text-[rgb(var(--foreground))]"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))]",
              )}
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              type="button"
            >
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          {activeFolder ? (
            <section>
              <div className="flex items-center justify-between gap-3 px-3">
                <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">
                  {activeFolder.name}
                </h3>
                {activeFolder.views.length > 0 ? (
                  <span className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
                    {activeFolder.views.map((view) => view.type.toLowerCase()).join(" / ")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-1">
                {activeFolder.documents.map((document) => (
                  <DocumentTreeNode
                    document={document}
                    key={document.id}
                    onNavigate={onNavigate}
                    openMap={openMap}
                    pathname={pathname}
                    setOpenMap={setOpenMap}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
