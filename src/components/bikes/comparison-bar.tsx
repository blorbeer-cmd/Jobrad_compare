"use client";

import type { Bike } from "@/adapters/types";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";

interface ComparisonBarProps {
  bikes: Bike[];
  onRemove: (bike: Bike) => void;
  onCompare: () => void;
}

export function ComparisonBar({ bikes, onRemove, onCompare }: ComparisonBarProps) {
  if (bikes.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex items-center gap-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {bikes.length} ausgew\u00e4hlt
        </span>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {bikes.map((bike) => (
            <div
              key={`${bike.dealer}:${bike.name}`}
              className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm"
            >
              <span className="max-w-[120px] truncate">{bike.name}</span>
              <button
                onClick={() => onRemove(bike)}
                className="shrink-0 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button onClick={onCompare} disabled={bikes.length < 2}>
          Vergleichen <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
