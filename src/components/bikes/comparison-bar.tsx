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
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="container flex items-center gap-3 py-3">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground hidden sm:block">
          {bikes.length} ausgewählt
        </span>

        <div className="flex flex-1 gap-2 overflow-x-auto">
          {bikes.map((bike) => (
            <div
              key={`${bike.dealer}:${bike.name}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
            >
              <span className="max-w-[100px] truncate sm:max-w-[140px]">{bike.name}</span>
              <button
                onClick={() => onRemove(bike)}
                className="shrink-0 rounded-full p-0.5 hover:bg-muted transition-colors"
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
          className="shrink-0 gap-1.5"
        >
          <GitCompareArrows className="h-4 w-4" />
          <span className="hidden sm:inline">Vergleichen</span>
          <span className="sm:hidden">({bikes.length})</span>
        </Button>
      </div>
    </div>
  );
}
