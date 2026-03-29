"use client";

import { Heart, ExternalLink, GitCompareArrows } from "lucide-react";
import type { Bike } from "@/adapters/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BikeCardProps {
  bike: Bike;
  isSaved?: boolean;
  onToggleSave?: (bike: Bike) => void;
  onCompare?: (bike: Bike) => void;
  isComparing?: boolean;
}

export function BikeCard({ bike, isSaved, onToggleSave, onCompare, isComparing }: BikeCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isComparing && "ring-2 ring-primary"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {bike.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bike.imageUrl}
            alt={bike.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-muted-foreground/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Save button */}
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(bike)}
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full p-2 shadow-md transition-all duration-200",
              "backdrop-blur-sm border",
              isSaved
                ? "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800"
                : "bg-white/90 border-white/50 dark:bg-slate-900/90 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-900"
            )}
            aria-label={isSaved ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isSaved ? "fill-red-500 text-red-500" : "text-slate-600 dark:text-slate-300"
              )}
            />
          </button>
        )}

        {/* Category badge */}
        <Badge
          className="absolute left-2.5 top-2.5 backdrop-blur-sm bg-white/90 text-foreground border-white/50 dark:bg-slate-900/90 dark:border-slate-700/50 dark:text-foreground"
          variant="outline"
        >
          {bike.category}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {bike.brand}
        </p>
        <h3 className="mt-1 font-semibold leading-snug line-clamp-2 text-sm">
          {bike.name}
        </h3>

        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold tabular-nums">
            {bike.price.toLocaleString("de-DE", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-base font-medium text-muted-foreground">&euro;</span>
          {bike.listPrice && bike.listPrice > bike.price && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              {bike.listPrice.toLocaleString("de-DE", { minimumFractionDigits: 0 })} €
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground truncate">{bike.dealer}</p>

        {bike.availability && (
          <Badge variant="outline" className="mt-2 w-fit text-xs">
            {bike.availability}
          </Badge>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            asChild
          >
            <a href={bike.dealerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Zum Händler
            </a>
          </Button>
          {onCompare && (
            <Button
              variant={isComparing ? "default" : "secondary"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onCompare(bike)}
              aria-label={isComparing ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isComparing ? "Gewählt" : "Vergleich"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
