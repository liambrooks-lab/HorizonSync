"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/shared/components/ui/button";

type ModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Modal({
  children,
  description,
  onClose,
  open,
  title,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            aria-label="Close modal"
            className="absolute inset-0 bg-[rgba(4,8,20,0.62)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            type="button"
          />

          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-describedby={description ? `${titleId}-description` : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 w-full max-w-xl rounded-[32px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.96)] shadow-[0_42px_140px_-54px_rgba(3,8,20,0.95)] backdrop-blur-2xl"
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] px-5 py-5">
              <div>
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]" id={titleId}>
                  {title}
                </h2>
                {description ? (
                  <p
                    className="mt-1 text-sm leading-6 text-[rgb(var(--muted-foreground))]"
                    id={`${titleId}-description`}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <Button onClick={onClose} size="icon" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="px-5 py-5">{children}</div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>,
    window.document.body,
  );
}
