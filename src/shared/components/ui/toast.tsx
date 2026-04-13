"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type ToastVariant = "error" | "info" | "success" | "warning";

type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const toastStyles: Record<
  ToastVariant,
  {
    icon: typeof Info;
    className: string;
    iconClassName: string;
  }
> = {
  info: {
    icon: Info,
    className:
      "border-[rgba(var(--accent-strong),0.18)] bg-[linear-gradient(135deg,rgba(var(--surface),0.96),rgba(var(--surface-elevated),0.9))]",
    iconClassName: "text-[rgb(var(--accent-strong))]",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(var(--surface),0.96))]",
    iconClassName: "text-emerald-400",
  },
  warning: {
    icon: ShieldAlert,
    className:
      "border-amber-400/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(var(--surface),0.96))]",
    iconClassName: "text-amber-300",
  },
  error: {
    icon: AlertTriangle,
    className:
      "border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.14),rgba(var(--surface),0.96))]",
    iconClassName: "text-rose-300",
  },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      duration = 4200,
      variant = "info",
      ...input
    }: ToastInput) => {
      const id = crypto.randomUUID();

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          variant,
          duration,
          ...input,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 top-4 z-[90] mx-auto flex max-w-md flex-col gap-3 sm:right-4 sm:left-auto sm:w-full">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = toastStyles[toast.variant ?? "info"];
            const Icon = style.icon;

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "pointer-events-auto overflow-hidden rounded-[26px] border px-4 py-4 shadow-[0_30px_90px_-45px_rgba(3,8,20,0.78)] backdrop-blur-2xl",
                  style.className,
                )}
                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                key={toast.id}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-[rgba(var(--surface-elevated),0.72)] p-2">
                    <Icon className={cn("h-4 w-4", style.iconClassName)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {toast.title}
                    </p>
                    {toast.description ? (
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    className="h-9 w-9 rounded-2xl"
                    onClick={() => removeToast(toast.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
