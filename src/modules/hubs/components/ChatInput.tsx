"use client";

import { Loader2, Paperclip, Send, X } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";

import type { SerializedHubMessage } from "@/modules/hubs/lib/hubs";
import { useUploadThing } from "@/shared/lib/uploadthing-client";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/components/ui/toast";

type ChatInputProps = {
  disabled: boolean;
  placeholder: string;
  routeId: string;
  serverId: string;
  onMessageCreated: (message: SerializedHubMessage) => void;
  onTyping: () => void;
};

export function ChatInput({
  disabled,
  placeholder,
  routeId,
  serverId,
  onMessageCreated,
  onTyping,
}: ChatInputProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { startUpload, isUploading } = useUploadThing("chatAttachmentUploader");

  async function handleSubmit() {
    if (disabled || isSending || isUploading) {
      return;
    }

    if (!content.trim() && !selectedFile) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const uploadedFiles = selectedFile
        ? await startUpload([selectedFile])
        : undefined;
      const uploadedFile = uploadedFiles?.[0];

      const response = await fetch("/api/hubs/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId,
          routeId,
          content,
          attachment: uploadedFile
            ? {
                url: uploadedFile.ufsUrl,
                name: uploadedFile.name,
                type: uploadedFile.type,
                size: uploadedFile.size,
              }
            : null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: SerializedHubMessage;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? "Unable to send the message.");
      }

      onMessageCreated(payload.message);
      setContent("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submissionError) {
      showToast({
        title: "Message not sent",
        description:
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to send the message.",
        variant: "error",
      });
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send the message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  return (
    <div className="border-t border-[rgb(var(--border))] px-4 py-4 sm:px-6 sm:py-5">
      <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 sm:p-4">
        {selectedFile ? (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              className="rounded-full p-1 text-[rgb(var(--muted-foreground))] transition hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--foreground))]"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex gap-3">
          <textarea
            className="min-h-[72px] flex-1 resize-none rounded-[22px] bg-transparent px-1 py-1 text-sm leading-6 text-[rgb(var(--foreground))] outline-none placeholder:text-[rgb(var(--muted-foreground))]"
            disabled={disabled || isSending || isUploading}
            onChange={(event) => {
              setContent(event.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            value={content}
          />

          <div className="flex flex-col justify-between gap-3">
            <input
              accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={disabled || isSending || isUploading}
              onClick={() => fileInputRef.current?.click()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              disabled={disabled || isSending || isUploading}
              onClick={() => void handleSubmit()}
              size="icon"
              type="button"
            >
              {isSending || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-rose-300">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
