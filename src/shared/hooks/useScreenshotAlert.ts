"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/shared/components/ui/toast";

const SCREENSHOT_TOAST_COOLDOWN_MS = 4000;

function isScreenshotShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();

  return (
    key === "printscreen" ||
    (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(key))
  );
}

export function useScreenshotAlert() {
  const { showToast } = useToast();
  const lastTriggeredAtRef = useRef(0);

  useEffect(() => {
    const handlePotentialScreenshot = (event: KeyboardEvent) => {
      if (!isScreenshotShortcut(event)) {
        return;
      }

      const now = Date.now();

      if (now - lastTriggeredAtRef.current < SCREENSHOT_TOAST_COOLDOWN_MS) {
        return;
      }

      lastTriggeredAtRef.current = now;
      showToast({
        title: "Screenshot detected",
        description:
          "For security and privacy reasons, taking screenshots is monitored.",
        variant: "warning",
      });
    };

    window.addEventListener("keydown", handlePotentialScreenshot);
    window.addEventListener("keyup", handlePotentialScreenshot);

    return () => {
      window.removeEventListener("keydown", handlePotentialScreenshot);
      window.removeEventListener("keyup", handlePotentialScreenshot);
    };
  }, [showToast]);
}
