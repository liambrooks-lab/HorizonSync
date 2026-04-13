"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type DrawerProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  onClose: () => void;
  open: boolean;
  placement?: "left" | "right";
  title: string;
  widthClassName?: string;
};

export function Drawer({
  children,
  className,
  description,
  onClose,
  open,
  placement = "left",
  title,
  widthClassName = "w-[min(88vw,360px)]",
}: DrawerProps) {
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
        <div className="fixed inset-0 z-[80]">
          <motion.button
            aria-label="Close panel"
            className="absolute inset-0 bg-[rgba(4,8,20,0.62)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            type="button"
          />

          <motion.aside
            animate={{ opacity: 1, x: 0 }}
            aria-describedby={description ? `${titleId}-description` : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className={cn(
              "absolute top-0 flex h-full flex-col border-[rgba(var(--border),0.9)] bg-[rgba(var(--surface),0.94)] shadow-[0_40px_120px_-50px_rgba(3,8,20,0.95)] backdrop-blur-2xl",
              placement === "left" ? "left-0 border-r" : "right-0 border-l",
              widthClassName,
              className,
            )}
            exit={{ opacity: 0.95, x: placement === "left" ? -32 : 32 }}
            initial={{ opacity: 0.95, x: placement === "left" ? -32 : 32 }}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]" id={titleId}>
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

            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    window.document.body,
  );
}
