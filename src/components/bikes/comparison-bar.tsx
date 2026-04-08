"use client";

import type { Bike } from "@/adapters/types";
import { Button } from "@/components/ui/button";
import { X, GitCompareArrows } from "lucide-react";

interface ComparisonBarProps {
  bikes: Bike[];
  onRemove: (bike: Bike) => void;
  onCompare: () => void;
}

export function ComparisonBar({ bikes, onRemove, onCompare }: ComparisonBarProps) {
  if (bikes.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] animate-slide-up">
      <div className="container flex items-center gap-3 py-3.5">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground hidden sm:flex items-center gap-1.5">
          <GitCompareArrows className="h-3.5 w-3.5" />
          {bikes.length} ausgewählt
        </span>

        <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
          {bikes.map((bike) => (
            <div
              key={`${bike.dealer}:${bike.name}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:shadow-md"
            >
              <span className="max-w-[120px] truncate sm:max-w-[160px]">{bike.name}</span>
              <button
                onClick={() => onRemove(bike)}
                className="shrink-0 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Aus Vergleich entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={onCompare}
          disabled={bikes.length < 2}
          size="sm"
          className="shrink-0 gap-1.5 shadow-sm"
        >
          <GitCompareArrows className="h-4 w-4" />
          <span className="hidden sm:inline">Vergleichen</span>
          <span className="sm:hidden">({bikes.length})</span>
        </Button>
      </div>
    </div>
  );
}
