"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={cn("relative inline-flex items-center gap-1", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-md">
          {content}
        </span>
      )}
    </span>
  );
}

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
}

/** Standalone info icon with tooltip — use next to labels */
export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} className={className}>
      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground hover:text-foreground transition-colors" />
    </Tooltip>
  );
}
