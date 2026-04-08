"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within <Dialog>");
  return context;
}

function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useDialog();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, onOpenChange } = useDialog();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  // Focus trap
  React.useEffect(() => {
    if (!open || !contentRef.current) return;
    const el = contentRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable element or the dialog itself
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      el.focus();
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogIdContext.Provider value={{ titleId, descId }}>
          {children}
        </DialogIdContext.Provider>
      </div>
    </div>
  );
}

// Internal context to pass generated IDs to title/description
const DialogIdContext = React.createContext<{ titleId: string; descId: string }>({ titleId: "", descId: "" });

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = React.useContext(DialogIdContext);
  return <h2 id={titleId} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = React.useContext(DialogIdContext);
  return <p id={descId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription };
