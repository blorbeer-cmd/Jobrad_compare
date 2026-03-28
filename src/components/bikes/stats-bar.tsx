import type { Bike } from "@/adapters/types";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsBarProps {
  bikes: Bike[];
  totalCount: number;
  loading?: boolean;
}

export function StatsBar({ bikes, totalCount, loading }: StatsBarProps) {
  const avgPrice = bikes.length > 0
    ? bikes.reduce((sum, b) => sum + b.price, 0) / bikes.length
    : 0;
  const minPrice = bikes.length > 0 ? Math.min(...bikes.map((b) => b.price)) : 0;
  const maxPrice = bikes.length > 0 ? Math.max(...bikes.map((b) => b.price)) : 0;
  const dealers = new Set(bikes.map((b) => b.dealer)).size;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Ergebnisse",
      value: (
        <span>
          {bikes.length}
          <span className="text-sm font-normal text-muted-foreground">
            /{totalCount}
          </span>
        </span>
      ),
    },
    {
      label: "Ø Preis",
      value: `${avgPrice.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`,
    },
    {
      label: "Preisspanne",
      value: `${minPrice.toLocaleString("de-DE")} – ${maxPrice.toLocaleString("de-DE")} €`,
    },
    {
      label: "Händler",
      value: dealers,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
