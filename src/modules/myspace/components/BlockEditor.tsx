"use client";

import {
  Heading1,
  ImagePlus,
  ListChecks,
  Save,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { useAssistant } from "@/modules/ai/hooks/useAssistant";
import {
  createReminderAction,
  toggleReminderAction,
  updateDocumentAction,
} from "@/modules/myspace/actions/document.actions";
import { ReminderModal } from "@/modules/myspace/components/ReminderModal";
import type {
  DocumentBlock,
  SerializedWorkspaceDocumentDetail,
} from "@/modules/myspace/lib/documents";
import { useUploadThing } from "@/shared/lib/uploadthing-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

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

export function BlockEditor({ document: workspaceDocument }: BlockEditorProps) {
  const { requestDraft } = useAssistant();
  const [title, setTitle] = useState(workspaceDocument.title);
  const [icon, setIcon] = useState(workspaceDocument.icon ?? "HS");
  const [blocks, setBlocks] = useState<DocumentBlock[]>(workspaceDocument.content);
  const [reminders, setReminders] = useState(workspaceDocument.reminders);
  const [isSaving, setIsSaving] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const { startUpload, isUploading } = useUploadThing("documentAssetUploader");

  async function saveDocument(nextBlocks = blocks, nextTitle = title, nextIcon = icon) {
    setIsSaving(true);

    try {
      const result = await updateDocumentAction({
        content: nextBlocks,
        coverImageUrl: workspaceDocument.coverImageUrl,
        documentId: workspaceDocument.id,
        folderId: workspaceDocument.folderId,
        icon: nextIcon,
        title: nextTitle,
      });

      if (result.document) {
        setBlocks(result.document.content);
        setTitle(result.document.title);
        setIcon(result.document.icon ?? "HS");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
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
          <Button onClick={() => setIsReminderOpen(true)} type="button" variant="secondary">
            Reminders
          </Button>
          <Button
            onClick={() =>
              requestDraft({
                excerpt:
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
        <Button
          disabled={isUploading}
          onClick={async () => {
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
          }}
          type="button"
          variant="secondary"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Image
        </Button>
        <Button
          disabled={isUploading}
          onClick={async () => {
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
          }}
          type="button"
          variant="secondary"
        >
          <Upload className="mr-2 h-4 w-4" />
          File
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {blocks.map((block) => {
          if (block.type === "paragraph") {
            return (
              <Textarea
                key={block.id}
                onChange={(event) =>
                  setBlocks((currentBlocks) =>
                    updateBlock(currentBlocks, block.id, () => ({
                      ...block,
                      content: event.target.value,
                    })),
                  )
                }
                placeholder="Write a paragraph..."
                value={block.content}
              />
            );
          }

          if (block.type === "heading") {
            return (
              <Input
                className="text-2xl font-semibold"
                key={block.id}
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
            );
          }

          if (block.type === "checklist") {
            return (
              <div
                className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-4"
                key={block.id}
              >
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
            );
          }

          if (block.type === "image") {
            return (
              <div
                className="overflow-hidden rounded-[24px] border border-[rgb(var(--border))]"
                key={block.id}
              >
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
            );
          }

          return (
            <a
              className="block rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-4"
              href={block.url}
              key={block.id}
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
          );
        })}
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
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              No reminders yet.
            </p>
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
  );
}
