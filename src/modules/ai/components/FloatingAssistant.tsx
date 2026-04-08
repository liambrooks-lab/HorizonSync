"use client";

import { Bot, Sparkles } from "lucide-react";

import { AIChatWindow } from "@/modules/ai/components/AIChatWindow";
import { useAssistant } from "@/modules/ai/hooks/useAssistant";
import { Button } from "@/shared/components/ui/button";

export function FloatingAssistant() {
  const { isOpen, toggle } = useAssistant();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
      {isOpen ? <AIChatWindow /> : null}

      <Button
        className="h-14 rounded-full px-5 shadow-[0_24px_80px_-34px_rgba(67,112,255,0.95)]"
        onClick={toggle}
        type="button"
      >
        {isOpen ? <Bot className="mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
        {isOpen ? "Hide assistant" : "Ask AI"}
      </Button>
    </div>
  );
}
