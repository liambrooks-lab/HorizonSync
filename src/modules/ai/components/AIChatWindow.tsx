"use client";

import { useEffect } from "react";
import { Bot, CornerDownLeft, Loader2, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useChat } from "ai/react";

import { useAssistant } from "@/modules/ai/hooks/useAssistant";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

export function AIChatWindow() {
  const pathname = usePathname();
  const { clearDraftRequest, close, draftRequest } = useAssistant();
  const {
    messages,
    input,
    isLoading,
    setInput,
    handleInputChange,
    handleSubmit,
  } = useChat({
    api: "/api/ai/chat",
    body: {
      context: {
        draftRequest,
        pathname,
      },
    },
    streamProtocol: "text",
  });

  useEffect(() => {
    if (!draftRequest) {
      return;
    }

    setInput(
      `Draft polished workspace content for "${draftRequest.title}". Use this context:\n${draftRequest.excerpt}`,
    );
    clearDraftRequest();
  }, [clearDraftRequest, draftRequest, setInput]);

  return (
    <section className="flex h-[min(72vh,720px)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[32px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.95)] shadow-[0_36px_120px_-56px_rgba(12,24,68,0.85)] backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--accent-strong))] text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted-foreground))]">
              AI Assistant
            </p>
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              Workspace copilot
            </h2>
          </div>
        </div>
        <Button onClick={close} size="icon" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] p-5">
            <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
              Start with a prompt
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Summarize what this screen is for",
                "Draft a project update for the Global feed",
                "Create a cleaner outline for my current document",
              ].map((prompt) => (
                <Button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  type="button"
                  variant="secondary"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            className={`rounded-[24px] px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-10 bg-[rgb(var(--accent-strong))] text-white"
                : "mr-10 border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--foreground))]"
            }`}
            key={message.id}
          >
            {message.content}
          </div>
        ))}

        {isLoading ? (
          <div className="mr-10 flex items-center gap-2 rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-3 text-sm text-[rgb(var(--muted-foreground))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        ) : null}
      </div>

      <form
        className="border-t border-[rgb(var(--border))] px-5 py-4"
        onSubmit={handleSubmit}
      >
        <Textarea
          className="min-h-[110px]"
          onChange={handleInputChange}
          placeholder="Ask HorizonSync AI to explain, summarize, or draft..."
          value={input}
        />
        <div className="mt-3 flex justify-end">
          <Button disabled={isLoading || !input.trim()} type="submit">
            <CornerDownLeft className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </form>
    </section>
  );
}
