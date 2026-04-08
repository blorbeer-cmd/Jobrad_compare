"use client";

import { useState } from "react";
import { Heart, ExternalLink, GitCompareArrows, Calculator, Bike as BikeIcon } from "lucide-react";
import type { Bike } from "@/adapters/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalcModal } from "@/components/tax/calc-modal";
import { cn } from "@/lib/utils";

interface BikeCardProps {
  bike: Bike;
  isSaved?: boolean;
  onToggleSave?: (bike: Bike) => void;
  onCompare?: (bike: Bike) => void;
  isComparing?: boolean;
  monthlyNetRate?: number;
  isLowestNetRate?: boolean;
}

export function BikeCard({ bike, isSaved, onToggleSave, onCompare, isComparing, monthlyNetRate, isLowestNetRate }: BikeCardProps) {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-300",
        "hover:shadow-card-hover hover:-translate-y-1",
        isComparing && "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60" role="img" aria-label={`Kein Bild für ${bike.name}`}>
            <BikeIcon className="h-16 w-16 text-muted-foreground/15" aria-hidden="true" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Save button */}
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(bike)}
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full p-2 shadow-md transition-all duration-200",
              "backdrop-blur-md border",
              isSaved
                ? "bg-red-50 border-red-200 dark:bg-red-950/60 dark:border-red-800 scale-110"
                : "bg-white/90 border-white/40 dark:bg-slate-900/90 dark:border-slate-700/50 hover:bg-white hover:scale-110 dark:hover:bg-slate-900"
            )}
            aria-label={isSaved ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-200",
                isSaved ? "fill-red-500 text-red-500" : "text-slate-500 dark:text-slate-300"
              )}
            />
          </button>
        )}

        {/* Category badge */}
        <Badge
          className="absolute left-2.5 top-2.5 backdrop-blur-md bg-white/90 text-foreground border-white/40 dark:bg-slate-900/90 dark:border-slate-700/50 dark:text-foreground shadow-sm"
          variant="outline"
        >
          {bike.category}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {bike.brand}
        </p>
        <h3 className="mt-1 font-semibold leading-snug line-clamp-2 text-sm">
          {bike.name}
        </h3>

        {/* Net rate (prominent) when profile is available */}
        {monthlyNetRate !== undefined ? (
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tabular-nums text-primary">
                {monthlyNetRate.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-semibold text-primary/80">€/Monat</span>
            </div>
            <p className="text-xs text-muted-foreground">
              netto · UVP{" "}
              {(bike.listPrice ?? bike.price).toLocaleString("de-DE", { minimumFractionDigits: 0 })} €
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-extrabold tabular-nums">
              {bike.price.toLocaleString("de-DE", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-sm font-medium text-muted-foreground">&euro;</span>
            {bike.listPrice && bike.listPrice > bike.price && (
              <span className="text-sm text-muted-foreground/70 line-through tabular-nums">
                {bike.listPrice.toLocaleString("de-DE", { minimumFractionDigits: 0 })} €
              </span>
            )}
          </div>
        )}

        <p className="mt-1.5 text-xs text-muted-foreground truncate">{bike.dealer}</p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {isLowestNetRate && (
            <Badge className="w-fit text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Niedrigste Netto-Rate
            </Badge>
          )}
          {bike.listPrice && bike.listPrice > bike.price && (
            <Badge className="w-fit text-[11px] bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              -{Math.round((1 - bike.price / bike.listPrice) * 100)}%
            </Badge>
          )}
          {bike.availability && (
            <Badge variant="outline" className="w-fit text-[11px]">
              {bike.availability}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            className="w-full gap-1.5 text-xs h-9 shadow-sm"
            asChild
          >
            <a href={bike.dealerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              Zum Händler
            </a>
          </Button>
          <div className={cn("grid gap-2", onCompare ? "grid-cols-2" : "grid-cols-1")}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setCalcOpen(true)}
            >
              <Calculator className="h-3.5 w-3.5 shrink-0" />
              Rechner
            </Button>
            {onCompare && (
              <Button
                variant={isComparing ? "default" : "outline"}
                size="sm"
                className={cn("gap-1.5 text-xs h-8", isComparing && "shadow-sm")}
                onClick={() => onCompare(bike)}
              >
                <GitCompareArrows className="h-3.5 w-3.5 shrink-0" />
                {isComparing ? "Gewählt" : "Vergleich"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <CalcModal bike={bike} open={calcOpen} onOpenChange={setCalcOpen} />
    </div>
  );
}
