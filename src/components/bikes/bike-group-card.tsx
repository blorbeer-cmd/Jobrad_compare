"use client";

import { ExternalLink, Store, TrendingDown, AlertCircle } from "lucide-react";
import type { BikeGroup } from "@/lib/entity-resolution";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BikeGroupCardProps {
  group: BikeGroup;
}

function PriceRow({
  price,
  dealer,
  dealerUrl,
  isBestOffer,
  listPrice,
}: {
  price: number;
  dealer: string;
  dealerUrl: string;
  isBestOffer: boolean;
  listPrice?: number;
}) {
  return (
    <a
      href={dealerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        isBestOffer
          ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
          : "hover:bg-muted/50"
      )}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {isBestOffer && <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{dealer}</span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0 ml-2">
        {listPrice && listPrice > price && (
          <span className="text-xs text-muted-foreground line-through tabular-nums">
            {listPrice.toLocaleString("de-DE")} €
          </span>
        )}
        <span className="tabular-nums font-semibold">{price.toLocaleString("de-DE")} €</span>
        <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
      </span>
    </a>
  );
}

export function BikeGroupCard({ group }: BikeGroupCardProps) {
  const savings = group.highestPrice - group.bestPrice;
  const representativeListing = group.listings[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {representativeListing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={representativeListing.imageUrl}
            alt={group.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60" role="img" aria-label={`Kein Bild für ${group.name}`}>
            <Store className="h-16 w-16 text-muted-foreground/15" aria-hidden="true" />
          </div>
        )}

        {/* Category badge */}
        <Badge
          className="absolute left-2.5 top-2.5 backdrop-blur-md bg-white/90 text-foreground border-white/40 dark:bg-slate-900/90 dark:border-slate-700/50 dark:text-foreground shadow-sm"
          variant="outline"
        >
          {group.category}
        </Badge>

        {/* Dealer count badge */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md border border-white/40 dark:bg-slate-900/90 dark:border-slate-700/50 px-2.5 py-1 shadow-sm">
          <Store className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-semibold">{group.dealerCount}</span>
        </div>

        {/* Savings badge — only for multi-dealer groups with price differences */}
        {group.dealerCount > 1 && savings > 0 && (
          <div className="absolute bottom-2.5 left-2.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            bis {savings.toLocaleString("de-DE")} € sparen
          </div>
        )}

        {/* Fuzzy match warning */}
        {group.confidence === "fuzzy" && (
          <div
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-amber-50/95 dark:bg-amber-900/80 text-amber-700 dark:text-amber-200 px-2 py-0.5 text-xs shadow-sm"
            title="Diese Angebote wurden automatisch zusammengeführt — Übereinstimmung nicht gesichert"
          >
            <AlertCircle className="h-3 w-3" />
            ähnlich
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {group.brand}
        </p>
        <h3 className="mt-1 font-semibold leading-snug line-clamp-2 text-sm">
          {group.name}
        </h3>

        {/* Price range */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tabular-nums">
            {group.bestPrice.toLocaleString("de-DE")}
          </span>
          <span className="text-sm font-medium text-muted-foreground">&euro;</span>
          {group.dealerCount > 1 && (
            <span className="text-sm text-muted-foreground/70">
              – {group.highestPrice.toLocaleString("de-DE")} €
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {group.dealerCount === 1
            ? "bei 1 Händler"
            : `bei ${group.dealerCount} Händlern`}
        </p>

        {/* Dealer price rows */}
        <div className="mt-3 flex flex-col gap-1">
          {group.listings.map((listing) => (
            <PriceRow
              key={`${listing.dealer}:${listing.dealerUrl}`}
              price={listing.price}
              dealer={listing.dealer}
              dealerUrl={listing.dealerUrl}
              isBestOffer={listing.isBestOffer}
              listPrice={listing.listPrice}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
