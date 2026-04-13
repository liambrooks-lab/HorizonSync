"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Heading1,
  ImagePlus,
  ListChecks,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useAssistant } from "@/modules/ai/hooks/useAssistant";
import {
  createDocumentAction,
  createReminderAction,
  moveDocumentAction,
  toggleReminderAction,
  updateDocumentAction,
} from "@/modules/myspace/actions/document.actions";
import { ReminderModal } from "@/modules/myspace/components/ReminderModal";
import { WorkspaceViewsPanel } from "@/modules/myspace/components/WorkspaceViewsPanel";
import type {
  DocumentBlock,
  SerializedWorkspaceDocumentDetail,
} from "@/modules/myspace/lib/documents";
import { useUploadThing } from "@/shared/lib/uploadthing-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/components/ui/toast";

type BlockEditorProps = {
  document: SerializedWorkspaceDocumentDetail;
};

function updateBlock(
  blocks: DocumentBlock[],
  blockId: string,
  updater: (block: DocumentBlock) => DocumentBlock,
) {
  return blocks.map((block) => (block.id === blockId ? updater(block) : block));
}

function moveBlock(blocks: DocumentBlock[], fromIndex: number, toIndex: number) {
  const nextBlocks = [...blocks];
  const [movedBlock] = nextBlocks.splice(fromIndex, 1);
  nextBlocks.splice(toIndex, 0, movedBlock);
  return nextBlocks;
}

export function BlockEditor({ document: workspaceDocument }: BlockEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { requestDraft } = useAssistant();
  const [title, setTitle] = useState(workspaceDocument.title);
  const [icon, setIcon] = useState(workspaceDocument.icon ?? "HS");
  const [blocks, setBlocks] = useState<DocumentBlock[]>(workspaceDocument.content);
  const [status, setStatus] = useState(workspaceDocument.status ?? "Backlog");
  const [dueDate, setDueDate] = useState(
    workspaceDocument.dueDate ? workspaceDocument.dueDate.slice(0, 16) : "",
  );
  const [reminders, setReminders] = useState(workspaceDocument.reminders);
  const [isSaving, setIsSaving] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const { startUpload, isUploading } = useUploadThing("documentAssetUploader");

  const excerpt = useMemo(
    () =>
      blocks
        .map((block) => {
          if ("content" in block) {
            return block.content;
          }

          if ("items" in block) {
            return block.items.map((item) => item.label).join(", ");
          }

          return block.fileName ?? "";
        })
        .join("\n")
        .slice(0, 1200),
    [blocks],
  );

  async function saveDocument(nextBlocks = blocks, nextTitle = title, nextIcon = icon) {
    setIsSaving(true);

    try {
      const result = await updateDocumentAction({
        content: nextBlocks,
        coverImageUrl: workspaceDocument.coverImageUrl,
        documentId: workspaceDocument.id,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        folderId: workspaceDocument.folderId,
        icon: nextIcon,
        parentId: workspaceDocument.parentId,
        status,
        title: nextTitle,
      });

      if (result.document) {
        setBlocks(result.document.content);
        setTitle(result.document.title);
        setIcon(result.document.icon ?? "HS");
        setStatus(result.document.status ?? "Backlog");
        setDueDate(result.document.dueDate ? result.document.dueDate.slice(0, 16) : "");
      }

      showToast({
        title: "Document saved",
        description: "Your page and workflow metadata are up to date.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function appendImageBlock() {
    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      const uploaded = await startUpload([file]);
      const asset = uploaded?.[0];

      if (!asset) {
        return;
      }

      setBlocks((currentBlocks) => [
        ...currentBlocks,
        {
          id: `block-${Date.now()}`,
          type: "image",
          url: asset.ufsUrl,
          caption: "",
          fileName: asset.name,
        },
      ]);
    };
    input.click();
  }

  async function appendFileBlock() {
    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = "*";
    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      const uploaded = await startUpload([file]);
      const asset = uploaded?.[0];

      if (!asset) {
        return;
      }

      setBlocks((currentBlocks) => [
        ...currentBlocks,
        {
          id: `block-${Date.now()}`,
          type: "file",
          url: asset.ufsUrl,
          fileName: asset.name,
          fileType: asset.type,
          fileSize: asset.size,
        },
      ]);
    };
    input.click();
  }

  async function handleSlashCommand(blockId: string, value: string) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue.startsWith("/")) {
      return false;
    }

    if (normalizedValue === "/h1" || normalizedValue === "/h2") {
      setBlocks((currentBlocks) =>
        updateBlock(currentBlocks, blockId, () => ({
          content: "",
          id: blockId,
          level: normalizedValue === "/h1" ? 1 : 2,
          type: "heading",
        })),
      );
      return true;
    }

    if (normalizedValue === "/todo") {
      setBlocks((currentBlocks) =>
        updateBlock(currentBlocks, blockId, () => ({
          id: blockId,
          items: [{ checked: false, id: `item-${Date.now()}`, label: "" }],
          type: "checklist",
        })),
      );
      return true;
    }

    if (normalizedValue === "/image") {
      await appendImageBlock();
      setBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== blockId));
      return true;
    }

    if (normalizedValue === "/file") {
      await appendFileBlock();
      setBlocks((currentBlocks) => currentBlocks.filter((block) => block.id !== blockId));
      return true;
    }

    return false;
  }

  return (
    <section className="space-y-6">
      <section className="panel-surface rounded-[30px] border border-[rgb(var(--border))] p-4 sm:p-6">
        <ReminderModal
          isOpen={isReminderOpen}
          onClose={() => setIsReminderOpen(false)}
          onSubmit={async ({ note, remindAt, title: reminderTitle }) => {
            const result = await createReminderAction({
              documentId: workspaceDocument.id,
              note,
              remindAt: new Date(remindAt).toISOString(),
              title: reminderTitle,
            });

            if (result.document) {
              setReminders(result.document.reminders);
            }
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--border))] pb-5">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Input
              className="w-20 text-center"
              maxLength={8}
              onChange={(event) => setIcon(event.target.value || "HS")}
              value={icon}
            />
            <Input
              className="w-full sm:w-[320px]"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="w-[160px]"
              onChange={(event) => setStatus(event.target.value)}
              placeholder="Status"
              value={status}
            />
            <Input
              className="w-[220px]"
              onChange={(event) => setDueDate(event.target.value)}
              type="datetime-local"
              value={dueDate}
            />
            <Button
              onClick={async () => {
                const result = await createDocumentAction({
                  folderId: workspaceDocument.folderId,
                  parentId: workspaceDocument.id,
                  title: `${title} sub-page`,
                });
                router.push(`/myspace/${result.documentId}`);
                router.refresh();
              }}
              type="button"
              variant="secondary"
            >
              Add sub-page
            </Button>
            <Button onClick={() => setIsReminderOpen(true)} type="button" variant="secondary">
              Reminders
            </Button>
            <Button
              onClick={() =>
                requestDraft({
                  excerpt,
                  title,
                })
              }
              type="button"
              variant="secondary"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ask AI to Draft
            </Button>
            <Button disabled={isSaving} onClick={() => void saveDocument()} type="button">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={() =>
              setBlocks((currentBlocks) => [
                ...currentBlocks,
                {
                  id: `block-${Date.now()}`,
                  type: "heading",
                  level: 2,
                  content: "",
                },
              ])
            }
            type="button"
            variant="secondary"
          >
            <Heading1 className="mr-2 h-4 w-4" />
            Heading
          </Button>
          <Button
            onClick={() =>
              setBlocks((currentBlocks) => [
                ...currentBlocks,
                {
                  id: `block-${Date.now()}`,
                  type: "paragraph",
                  content: "",
                },
              ])
            }
            type="button"
            variant="secondary"
          >
            <Type className="mr-2 h-4 w-4" />
            Paragraph
          </Button>
          <Button
            onClick={() =>
              setBlocks((currentBlocks) => [
                ...currentBlocks,
                {
                  id: `block-${Date.now()}`,
                  type: "checklist",
                  items: [{ id: `item-${Date.now()}`, label: "", checked: false }],
                },
              ])
            }
            type="button"
            variant="secondary"
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Checklist
          </Button>
          <Button disabled={isUploading} onClick={() => void appendImageBlock()} type="button" variant="secondary">
            <ImagePlus className="mr-2 h-4 w-4" />
            Image
          </Button>
          <Button disabled={isUploading} onClick={() => void appendFileBlock()} type="button" variant="secondary">
            <Upload className="mr-2 h-4 w-4" />
            File
          </Button>
        </div>

        <div className="mt-6 space-y-5">
          {blocks.map((block, index) => (
            <div
              className="group rounded-[24px] border border-transparent hover:border-[rgb(var(--border))]"
              draggable
              key={block.id}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggingBlockId(block.id)}
              onDrop={() => {
                if (!draggingBlockId || draggingBlockId === block.id) {
                  return;
                }

                const fromIndex = blocks.findIndex((candidate) => candidate.id === draggingBlockId);
                const toIndex = blocks.findIndex((candidate) => candidate.id === block.id);

                if (fromIndex < 0 || toIndex < 0) {
                  return;
                }

                setBlocks((currentBlocks) => moveBlock(currentBlocks, fromIndex, toIndex));
                setDraggingBlockId(null);
              }}
            >
              <div className="mb-2 flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-[rgb(var(--muted-foreground))]" />
                <Button
                  disabled={index === 0}
                  onClick={() =>
                    setBlocks((currentBlocks) => moveBlock(currentBlocks, index, Math.max(index - 1, 0)))
                  }
                  size="icon"
                  variant="ghost"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  disabled={index === blocks.length - 1}
                  onClick={() =>
                    setBlocks((currentBlocks) =>
                      moveBlock(currentBlocks, index, Math.min(index + 1, currentBlocks.length - 1)),
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {block.type === "paragraph" ? (
                <Textarea
                  onChange={(event) =>
                    setBlocks((currentBlocks) =>
                      updateBlock(currentBlocks, block.id, () => ({
                        ...block,
                        content: event.target.value,
                      })),
                    )
                  }
                  onKeyDown={async (event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      const handled = await handleSlashCommand(block.id, block.content);
                      if (handled) {
                        event.preventDefault();
                      }
                    }
                  }}
                  placeholder="Write a paragraph... Try /h1, /h2, /todo, /image, /file"
                  value={block.content}
                />
              ) : null}

              {block.type === "heading" ? (
                <Input
                  className="text-2xl font-semibold"
                  onChange={(event) =>
                    setBlocks((currentBlocks) =>
                      updateBlock(currentBlocks, block.id, () => ({
                        ...block,
                        content: event.target.value,
                      })),
                    )
                  }
                  placeholder="Heading"
                  value={block.content}
                />
              ) : null}

              {block.type === "checklist" ? (
                <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-4">
                  <div className="space-y-3">
                    {block.items.map((item) => (
                      <label className="flex items-center gap-3" key={item.id}>
                        <input
                          checked={item.checked}
                          onChange={(event) =>
                            setBlocks((currentBlocks) =>
                              updateBlock(currentBlocks, block.id, () => ({
                                ...block,
                                items: block.items.map((candidate) =>
                                  candidate.id === item.id
                                    ? { ...candidate, checked: event.target.checked }
                                    : candidate,
                                ),
                              })),
                            )
                          }
                          type="checkbox"
                        />
                        <Input
                          onChange={(event) =>
                            setBlocks((currentBlocks) =>
                              updateBlock(currentBlocks, block.id, () => ({
                                ...block,
                                items: block.items.map((candidate) =>
                                  candidate.id === item.id
                                    ? { ...candidate, label: event.target.value }
                                    : candidate,
                                ),
                              })),
                            )
                          }
                          value={item.label}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button
                      onClick={() =>
                        setBlocks((currentBlocks) =>
                          updateBlock(currentBlocks, block.id, () => ({
                            ...block,
                            items: [
                              ...block.items,
                              {
                                id: `item-${Date.now()}`,
                                label: "",
                                checked: false,
                              },
                            ],
                          })),
                        )
                      }
                      type="button"
                      variant="ghost"
                    >
                      Add checklist item
                    </Button>
                  </div>
                </div>
              ) : null}

              {block.type === "image" ? (
                <div className="overflow-hidden rounded-[24px] border border-[rgb(var(--border))]">
                  <img
                    alt={block.caption || "Document image"}
                    className="max-h-[420px] w-full object-cover"
                    src={block.url}
                  />
                  <Input
                    className="rounded-none border-0 border-t"
                    onChange={(event) =>
                      setBlocks((currentBlocks) =>
                        updateBlock(currentBlocks, block.id, () => ({
                          ...block,
                          caption: event.target.value,
                        })),
                      )
                    }
                    placeholder="Image caption"
                    value={block.caption}
                  />
                </div>
              ) : null}

              {block.type === "file" ? (
                <a
                  className="block rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-4"
                  href={block.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                    {block.fileName}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                    {block.fileType ?? "Attachment"}
                  </p>
                </a>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[26px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
                Reminders
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--foreground))]">
                Keep this document moving
              </h3>
            </div>
            <Button onClick={() => setIsReminderOpen(true)} type="button" variant="secondary">
              Add reminder
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {reminders.length === 0 ? (
              <p className="text-sm text-[rgb(var(--muted-foreground))]">No reminders yet.</p>
            ) : (
              reminders.map((reminder) => (
                <label
                  className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3"
                  key={reminder.id}
                >
                  <input
                    checked={reminder.completed}
                    onChange={async (event) => {
                      const result = await toggleReminderAction({
                        completed: event.target.checked,
                        documentId: workspaceDocument.id,
                        reminderId: reminder.id,
                      });

                      if (result.document) {
                        setReminders(result.document.reminders);
                      }
                    }}
                    type="checkbox"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {reminder.title}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                      {new Date(reminder.remindAt).toLocaleString()}
                    </p>
                    {reminder.note ? (
                      <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                        {reminder.note}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </section>

      {workspaceDocument.folderId ? (
        <WorkspaceViewsPanel
          activeDocumentId={workspaceDocument.id}
          documents={workspaceDocument.folderDocuments}
          views={workspaceDocument.folderViews}
        />
      ) : null}
    </section>
  );
}
