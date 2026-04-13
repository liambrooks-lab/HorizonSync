"use client";

import { BarChart3, ImagePlus, Loader2, Send, X } from "lucide-react";
import { useRef, useState } from "react";

import type { SerializedPostPreview } from "@/modules/global/lib/posts";
import { useUploadThing } from "@/shared/lib/uploadthing-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/components/ui/toast";

type FeedComposerProps = {
  onClearQuote?: () => void;
  onCreate: (input: {
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    mediaName?: string | null;
    quotePostId?: string | null;
    poll?: {
      question?: string | null;
      allowMultipleVotes?: boolean;
      options: string[];
    } | null;
  }) => Promise<void>;
  quoteTarget?: SerializedPostPreview | null;
};

function QuotePreview({
  onClear,
  quoteTarget,
}: {
  onClear?: () => void;
  quoteTarget: SerializedPostPreview;
}) {
  return (
    <div className="mt-4 rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.78)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
            Quote post
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--foreground))]">
            {quoteTarget.author.name}
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
            {quoteTarget.content}
          </p>
        </div>

        {onClear ? (
          <Button onClick={onClear} size="icon" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FeedComposer({ onClearQuote, onCreate, quoteTarget }: FeedComposerProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { startUpload, isUploading } = useUploadThing("postMediaUploader");

  async function handleSubmit() {
    if (isSubmitting || isUploading) {
      return;
    }

    const normalizedPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);

    if (!content.trim() && !selectedFile && !quoteTarget && normalizedPollOptions.length === 0) {
      setError("Share a thought, attach media, quote a post, or add a poll before publishing.");
      return;
    }

    if (isPollEnabled && (normalizedPollOptions.length < 2 || normalizedPollOptions.length > 4)) {
      setError("Polls must have between 2 and 4 options.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const uploadResult = selectedFile ? await startUpload([selectedFile]) : undefined;
      const uploadedAsset = uploadResult?.[0];

      await onCreate({
        content,
        mediaName: uploadedAsset?.name ?? null,
        mediaType: uploadedAsset?.type ?? null,
        mediaUrl: uploadedAsset?.ufsUrl ?? null,
        poll: isPollEnabled
          ? {
              allowMultipleVotes,
              options: normalizedPollOptions,
              question: pollQuestion || null,
            }
          : null,
        quotePostId: quoteTarget?.id ?? null,
      });

      setContent("");
      setSelectedFile(null);
      setIsPollEnabled(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setAllowMultipleVotes(false);
      onClearQuote?.();

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

      {quoteTarget ? <QuotePreview onClear={onClearQuote} quoteTarget={quoteTarget} /> : null}

      {isPollEnabled ? (
        <div className="mt-4 rounded-[24px] border border-[rgb(var(--border))] bg-[rgba(var(--surface-elevated),0.78)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[rgb(var(--foreground))]">Poll</p>
            <Button onClick={() => setIsPollEnabled(false)} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            <Input
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Optional poll question"
              value={pollQuestion}
            />

            {pollOptions.map((option, index) => (
              <Input
                key={index}
                onChange={(event) =>
                  setPollOptions((currentOptions) =>
                    currentOptions.map((currentOption, currentIndex) =>
                      currentIndex === index ? event.target.value : currentOption,
                    ),
                  )
                }
                placeholder={`Option ${index + 1}`}
                value={option}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {pollOptions.length < 4 ? (
              <Button
                onClick={() => setPollOptions((currentOptions) => [...currentOptions, ""])}
                type="button"
                variant="secondary"
              >
                Add option
              </Button>
            ) : null}

            {pollOptions.length > 2 ? (
              <Button
                onClick={() => setPollOptions((currentOptions) => currentOptions.slice(0, -1))}
                type="button"
                variant="ghost"
              >
                Remove option
              </Button>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
              <input
                checked={allowMultipleVotes}
                onChange={(event) => setAllowMultipleVotes(event.target.checked)}
                type="checkbox"
              />
              Allow multiple votes
            </label>
          </div>
        </div>
      ) : null}

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
        <div className="flex flex-wrap items-center gap-3">
          <input
            accept="image/*,.pdf"
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            ref={fileInputRef}
            type="file"
          />
          <Button onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
            <ImagePlus className="mr-2 h-4 w-4" />
            Add media
          </Button>
          <Button
            onClick={() => setIsPollEnabled((currentValue) => !currentValue)}
            type="button"
            variant="secondary"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {isPollEnabled ? "Hide poll" : "Add poll"}
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
