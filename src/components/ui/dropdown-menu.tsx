"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  menuId: string;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

function useDropdown() {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("useDropdown must be used within <DropdownMenu>");
  return context;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const triggerId = React.useId();
  const menuId = React.useId();

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        // Return focus to trigger
        const trigger = ref.current?.querySelector(`#${CSS.escape(triggerId)}`) as HTMLElement | null;
        trigger?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, triggerId]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerId, menuId }}>
      <div ref={ref} className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { open, setOpen, triggerId, menuId } = useDropdown();
  const ariaProps = {
    "aria-expanded": open,
    "aria-haspopup": "menu" as const,
    "aria-controls": open ? menuId : undefined,
    id: triggerId,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: () => setOpen(!open),
      ...ariaProps,
    });
  }
  return <button onClick={() => setOpen(!open)} {...ariaProps}>{children}</button>;
}

function DropdownMenuContent({ children, className, align = "end" }: { children: React.ReactNode; className?: string; align?: "start" | "end" }) {
  const { open, menuId, triggerId } = useDropdown();
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Focus first item when menu opens
  React.useEffect(() => {
    if (open && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      onKeyDown={(e) => {
        if (!menuRef.current) return;
        const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = (currentIndex + 1) % items.length;
          items[next]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (currentIndex - 1 + items.length) % items.length;
          items[prev]?.focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          items[0]?.focus();
        } else if (e.key === "End") {
          e.preventDefault();
          items[items.length - 1]?.focus();
        }
      }}
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  const { setOpen } = useDropdown();
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={() => { onClick?.(); setOpen(false); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
