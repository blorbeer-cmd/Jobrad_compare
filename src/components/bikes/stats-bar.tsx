import type { Bike } from "@/adapters/types";

interface StatsBarProps {
  bikes: Bike[];
  totalCount: number;
}

export function StatsBar({ bikes, totalCount }: StatsBarProps) {
  const avgPrice = bikes.length > 0
    ? bikes.reduce((sum, b) => sum + b.price, 0) / bikes.length
    : 0;
  const minPrice = bikes.length > 0 ? Math.min(...bikes.map((b) => b.price)) : 0;
  const maxPrice = bikes.length > 0 ? Math.max(...bikes.map((b) => b.price)) : 0;
  const dealers = new Set(bikes.map((b) => b.dealer)).size;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Ergebnisse</p>
        <p className="text-2xl font-bold">{bikes.length}<span className="text-sm font-normal text-muted-foreground">/{totalCount}</span></p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Durchschnittspreis</p>
        <p className="text-2xl font-bold">{avgPrice.toLocaleString("de-DE", { maximumFractionDigits: 0 })} &euro;</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Preisspanne</p>
        <p className="text-2xl font-bold">{minPrice.toLocaleString("de-DE")} &ndash; {maxPrice.toLocaleString("de-DE")} &euro;</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">H\u00e4ndler</p>
        <p className="text-2xl font-bold">{dealers}</p>
      </div>
    </div>
  );
}
