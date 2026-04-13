"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
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
    <Modal
      description="Add a follow-up checkpoint to this document."
      onClose={onClose}
      open={isOpen}
      title="Schedule a follow-up"
    >
      <div className="space-y-4">
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
    </Modal>
  );
}
