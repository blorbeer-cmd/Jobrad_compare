"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus trap and initial focus
  React.useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus close button initially
    const closeBtn = el.querySelector<HTMLElement>('[data-sheet-close]');
    closeBtn?.focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab" || !el) return;
      const focusableEls = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative ml-auto flex h-full w-[min(85vw,360px)] flex-col bg-background shadow-xl",
          "animate-in slide-in-from-right duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Seitenpanel"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          {title && <h2 id={titleId} className="font-semibold">{title}</h2>}
          <button
            data-sheet-close
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 hover:bg-muted transition-colors"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
