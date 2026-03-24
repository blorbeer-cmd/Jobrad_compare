"use client";

import type { Bike } from "@/adapters/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink } from "lucide-react";

interface ComparisonViewProps {
  bikes: Bike[];
  onRemove: (bike: Bike) => void;
  onClear: () => void;
}

export function ComparisonView({ bikes, onRemove, onClear }: ComparisonViewProps) {
  if (bikes.length === 0) return null;

  const fields: { label: string; render: (b: Bike) => React.ReactNode }[] = [
    {
      label: "Bild",
      render: (b) =>
        b.imageUrl ? (
          <img src={b.imageUrl} alt={b.name} className="mx-auto h-32 w-auto rounded-md object-contain" />
        ) : (
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs">Kein Bild</div>
        ),
    },
    { label: "Marke", render: (b) => b.brand },
    { label: "Kategorie", render: (b) => <Badge variant="secondary">{b.category}</Badge> },
    {
      label: "Preis",
      render: (b) => (
        <span className="text-lg font-bold">
          {b.price.toLocaleString("de-DE")} &euro;
        </span>
      ),
    },
    { label: "H\u00e4ndler", render: (b) => b.dealer },
    {
      label: "Verf\u00fcgbarkeit",
      render: (b) => b.availability || <span className="text-muted-foreground">k.A.</span>,
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
          Zum H\u00e4ndler <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
  ];

  // Find lowest price for highlighting
  const minPrice = Math.min(...bikes.map((b) => b.price));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Vergleich ({bikes.length} Fahrr\u00e4der)
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Alle entfernen
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-36 px-4 py-3 text-left font-medium text-muted-foreground"></th>
              {bikes.map((bike) => (
                <th key={`${bike.dealer}:${bike.name}`} className="min-w-[200px] px-4 py-3">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold leading-tight text-left">{bike.name}</span>
                    <button
                      onClick={() => onRemove(bike)}
                      className="ml-2 shrink-0 rounded-full p-1 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.label} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium text-muted-foreground">{field.label}</td>
                {bikes.map((bike) => (
                  <td
                    key={`${bike.dealer}:${bike.name}`}
                    className={`px-4 py-3 text-center ${
                      field.label === "Preis" && bike.price === minPrice
                        ? "bg-green-50 font-bold text-green-700"
                        : ""
                    }`}
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
