"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DraftRequest = {
  title: string;
  excerpt: string;
} | null;

type AssistantContextValue = {
  close: () => void;
  clearDraftRequest: () => void;
  draftRequest: DraftRequest;
  isOpen: boolean;
  open: () => void;
  requestDraft: (draftRequest: Exclude<DraftRequest, null>) => void;
  toggle: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftRequest, setDraftRequest] = useState<DraftRequest>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);
  const clearDraftRequest = useCallback(() => setDraftRequest(null), []);

  const requestDraft = useCallback((nextDraftRequest: Exclude<DraftRequest, null>) => {
    setDraftRequest(nextDraftRequest);
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      close,
      clearDraftRequest,
      draftRequest,
      isOpen,
      open,
      requestDraft,
      toggle,
    }),
    [close, clearDraftRequest, draftRequest, isOpen, open, requestDraft, toggle],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error("useAssistant must be used within an AssistantProvider.");
  }

  return context;
}
