"use client";

import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useRef, useState } from "react";

import { useUploadThing } from "@/shared/lib/uploadthing-client";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/components/ui/toast";

type FeedComposerProps = {
  onCreate: (input: {
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    mediaName?: string | null;
  }) => Promise<void>;
};

export function FeedComposer({ onCreate }: FeedComposerProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { startUpload, isUploading } = useUploadThing("postMediaUploader");

  async function handleSubmit() {
    if (isSubmitting || isUploading) {
      return;
    }

    if (!content.trim() && !selectedFile) {
      setError("Share a thought or attach media before posting.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const uploadResult = selectedFile
        ? await startUpload([selectedFile])
        : undefined;
      const uploadedAsset = uploadResult?.[0];

      await onCreate({
        content,
        mediaName: uploadedAsset?.name ?? null,
        mediaType: uploadedAsset?.type ?? null,
        mediaUrl: uploadedAsset?.ufsUrl ?? null,
      });

      setContent("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showToast({
        title: "Post published",
        description: "Your update is now live in the global feed.",
        variant: "success",
      });
    } catch (submissionError) {
      showToast({
        title: "Unable to publish",
        description:
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to publish the post.",
        variant: "error",
      });
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to publish the post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel-surface rounded-[30px] border border-[rgb(var(--border))] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
            Broadcast
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--foreground))]">
            Share with the entire workspace
          </h2>
        </div>

        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted-foreground))]">
          Global
        </div>
      </div>

      <div className="mt-5">
        <Textarea
          className="min-h-[140px]"
          maxLength={2000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What is moving across HorizonSync today?"
          value={content}
        />
      </div>

      {selectedFile ? (
        <div className="mt-4 flex items-center justify-between rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            accept="image/*,.pdf"
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            ref={fileInputRef}
            type="file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Add media
          </Button>
        </div>

        <Button
          disabled={isSubmitting || isUploading}
          onClick={() => void handleSubmit()}
          type="button"
        >
          {isSubmitting || isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Publish post
        </Button>
      </div>
    </section>
  );
}
