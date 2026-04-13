"use client";

import { CalendarDays, KanbanSquare, List, Table2 } from "lucide-react";
import { WorkspaceViewType } from "@prisma/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { moveDocumentAction } from "@/modules/myspace/actions/document.actions";
import type {
  SerializedWorkspaceDocument,
  SerializedWorkspaceView,
} from "@/modules/myspace/lib/documents";

const statusColumns = ["Backlog", "In Progress", "Review", "Done"];

function flattenDocuments(documents: SerializedWorkspaceDocument[]): SerializedWorkspaceDocument[] {
  return documents.flatMap((document) => [document, ...flattenDocuments(document.children)]);
}

const viewIcons = {
  [WorkspaceViewType.LIST]: List,
  [WorkspaceViewType.TABLE]: Table2,
  [WorkspaceViewType.KANBAN]: KanbanSquare,
  [WorkspaceViewType.CALENDAR]: CalendarDays,
};

type WorkspaceViewsPanelProps = {
  activeDocumentId: string;
  documents: SerializedWorkspaceDocument[];
  views: SerializedWorkspaceView[];
};

export function WorkspaceViewsPanel({
  activeDocumentId,
  documents,
  views,
}: WorkspaceViewsPanelProps) {
  const router = useRouter();
  const [activeViewId, setActiveViewId] = useState<string | null>(views[0]?.id ?? null);
  const flatDocuments = useMemo(() => flattenDocuments(documents), [documents]);
  const activeView = views.find((view) => view.id === activeViewId) ?? views[0] ?? null;

  if (!activeView) {
    return null;
  }

  async function moveDocument(documentId: string, status: string) {
    await moveDocumentAction({
      documentId,
      status,
    });
    router.refresh();
  }

  return (
    <section className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.64)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Workspace views
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--foreground))]">
            Folder-level planning
          </h3>
        </div>

        <div className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.7)] p-1">
          {views.map((view) => {
            const Icon = viewIcons[view.type];

            return (
              <button
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  activeView.id === view.id
                    ? "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                    : "text-[rgb(var(--muted-foreground))]"
                }`}
                key={view.id}
                onClick={() => setActiveViewId(view.id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                {view.name}
              </button>
            );
          })}
        </div>
      </div>

      {activeView.type === WorkspaceViewType.LIST || activeView.type === WorkspaceViewType.TABLE ? (
        <div className="mt-5 overflow-hidden rounded-[24px] border border-[rgb(var(--border))]">
          <div className="grid grid-cols-[minmax(0,1.8fr)_140px_160px] bg-[rgba(var(--surface),0.78)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
            <span>Document</span>
            <span>Status</span>
            <span>Due date</span>
          </div>
          {flatDocuments.map((document) => (
            <div
              className="grid grid-cols-[minmax(0,1.8fr)_140px_160px] items-center border-t border-[rgb(var(--border))] px-4 py-3 text-sm"
              key={document.id}
            >
              <span className={document.id === activeDocumentId ? "font-semibold text-[rgb(var(--foreground))]" : "text-[rgb(var(--foreground))]"}>
                {document.title}
              </span>
              <span className="text-[rgb(var(--muted-foreground))]">{document.status ?? "Backlog"}</span>
              <span className="text-[rgb(var(--muted-foreground))]">
                {document.dueDate ? new Date(document.dueDate).toLocaleDateString() : "No date"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {activeView.type === WorkspaceViewType.KANBAN ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          {statusColumns.map((status) => (
            <div
              className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.78)] p-4"
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                const documentId = event.dataTransfer.getData("text/plain");
                if (!documentId) {
                  return;
                }
                await moveDocument(documentId, status);
              }}
            >
              <p className="text-sm font-semibold text-[rgb(var(--foreground))]">{status}</p>
              <div className="mt-3 space-y-3">
                {flatDocuments
                  .filter((document) => (document.status ?? "Backlog") === status)
                  .map((document) => (
                    <div
                      className="rounded-[20px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-3"
                      draggable
                      key={document.id}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", document.id)}
                    >
                      <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                        {document.title}
                      </p>
                      <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
                        {document.dueDate
                          ? new Date(document.dueDate).toLocaleDateString()
                          : "No due date"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeView.type === WorkspaceViewType.CALENDAR ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flatDocuments
            .filter((document) => document.dueDate)
            .sort((left, right) => new Date(left.dueDate ?? "").getTime() - new Date(right.dueDate ?? "").getTime())
            .map((document) => (
              <div
                className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.78)] p-4"
                key={document.id}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
                  {new Date(document.dueDate ?? "").toLocaleDateString()}
                </p>
                <p className="mt-3 text-sm font-semibold text-[rgb(var(--foreground))]">
                  {document.title}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                  {document.status ?? "Backlog"}
                </p>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}
