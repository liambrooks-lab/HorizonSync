"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

type ReminderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    note: string;
    remindAt: string;
  }) => Promise<void>;
};

export function ReminderModal({
  isOpen,
  onClose,
  onSubmit,
}: ReminderModalProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [remindAt, setRemindAt] = useState("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-[0_36px_120px_-54px_rgba(12,24,68,0.85)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
          Reminder
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--foreground))]">
          Schedule a follow-up
        </h2>

        <div className="mt-5 space-y-4">
          <Input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reminder title"
            value={title}
          />
          <Input
            onChange={(event) => setRemindAt(event.target.value)}
            type="datetime-local"
            value={remindAt}
          />
          <Textarea
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
            value={note}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onSubmit({ note, remindAt, title });
              setTitle("");
              setNote("");
              setRemindAt("");
              onClose();
            }}
            type="button"
          >
            Save reminder
          </Button>
        </div>
      </div>
    </div>
  );
}
