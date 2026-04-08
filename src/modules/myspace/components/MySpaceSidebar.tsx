"use client";

import Link from "next/link";
import { FolderPlus, FilePlus2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  createDocumentAction,
  createFolderAction,
} from "@/modules/myspace/actions/document.actions";
import type { SerializedWorkspaceFolder } from "@/modules/myspace/lib/documents";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

type MySpaceSidebarProps = {
  folders: SerializedWorkspaceFolder[];
};

export function MySpaceSidebar({ folders }: MySpaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(folders[0]?.id ?? null);

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-[rgb(var(--border))] bg-[rgba(var(--surface),0.82)] backdrop-blur-xl">
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
                folderId: activeFolderId === "unfiled" ? null : activeFolderId,
              });
              setDocumentName("");
              router.push(`/myspace/${result.documentId}`);
              router.refresh();
            }}
            size="icon"
            type="button"
          >
            <FilePlus2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          {folders.map((folder) => (
            <section key={folder.id}>
              <button
                className={cn(
                  "w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold transition",
                  activeFolderId === folder.id
                    ? "bg-[rgb(var(--surface-elevated))] text-[rgb(var(--foreground))]"
                    : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))]",
                )}
                onClick={() => setActiveFolderId(folder.id)}
                type="button"
              >
                {folder.name}
              </button>
              <div className="mt-2 space-y-1">
                {folder.documents.map((document) => {
                  const isActive = pathname === `/myspace/${document.id}`;

                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                        isActive
                          ? "bg-[rgb(var(--accent-strong))] text-white"
                          : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-elevated))] hover:text-[rgb(var(--foreground))]",
                      )}
                      href={`/myspace/${document.id}`}
                      key={document.id}
                    >
                      <span>{document.icon ?? "📄"}</span>
                      <span className="truncate">{document.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
