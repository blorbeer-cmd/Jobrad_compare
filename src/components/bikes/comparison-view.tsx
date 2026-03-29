"use client";

import type { Bike } from "@/adapters/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonViewProps {
  bikes: Bike[];
  onRemove: (bike: Bike) => void;
  onClear: () => void;
}

export function ComparisonView({ bikes, onRemove, onClear }: ComparisonViewProps) {
  if (bikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <GitCompareArrows className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="mt-4 font-semibold">Kein Vergleich gestartet</p>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          Wähle bis zu 4 Fahrräder im Durchsuchen-Tab aus, um sie hier zu vergleichen.
        </p>
      </div>
    );
  }

  const fields: { label: string; render: (b: Bike) => React.ReactNode }[] = [
    {
      label: "Bild",
      render: (b) =>
        b.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.imageUrl}
            alt={b.name}
            className="mx-auto h-28 w-auto rounded-lg object-contain"
          />
        ) : (
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            Kein Bild
          </div>
        ),
    },
    { label: "Marke", render: (b) => b.brand },
    {
      label: "Kategorie",
      render: (b) => <Badge variant="secondary">{b.category}</Badge>,
    },
    {
      label: "Preis",
      render: (b) => (
        <span className="text-lg font-bold tabular-nums">
          {b.price.toLocaleString("de-DE")} &euro;
        </span>
      ),
    },
    { label: "Händler", render: (b) => b.dealer },
    {
      label: "Verfügbarkeit",
      render: (b) =>
        b.availability || (
          <span className="text-muted-foreground text-sm">k.A.</span>
        ),
    },
    {
      label: "Link",
      render: (b) => (
        <a
          href={b.dealerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Zum Händler <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
  ];

  const minPrice = Math.min(...bikes.map((b) => b.price));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Vergleich
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            ({bikes.length} Fahrräder)
          </span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
          <X className="h-4 w-4" />
          Alle entfernen
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                &nbsp;
              </th>
              {bikes.map((bike) => (
                <th
                  key={`${bike.dealer}:${bike.name}`}
                  className={cn(
                    "min-w-[180px] px-4 py-3",
                    bike.price === minPrice && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-left leading-snug text-sm">
                      {bike.name}
                    </span>
                    <button
                      onClick={() => onRemove(bike)}
                      className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
                      aria-label="Aus Vergleich entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {bike.price === minPrice && bikes.length > 1 && (
                    <Badge className="mt-1 text-[10px]" variant="default">
                      Bestes Angebot
                    </Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr
                key={field.label}
                className={cn("border-b last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}
              >
                <td className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {field.label}
                </td>
                {bikes.map((bike) => (
                  <td
                    key={`${bike.dealer}:${bike.name}`}
                    className={cn(
                      "px-4 py-3 text-center",
                      field.label === "Preis" && bike.price === minPrice && bikes.length > 1
                        ? "text-primary font-bold"
                        : ""
                    )}
                  >
                    {field.render(bike)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
