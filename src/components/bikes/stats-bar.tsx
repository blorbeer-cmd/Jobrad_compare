import type { Bike } from "@/adapters/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, ArrowLeftRight, Store } from "lucide-react";

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
      icon: Search,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
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
      icon: TrendingUp,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
      value: `${avgPrice.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`,
    },
    {
      label: "Preisspanne",
      icon: ArrowLeftRight,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/50",
      value: `${minPrice.toLocaleString("de-DE")} – ${maxPrice.toLocaleString("de-DE")} €`,
    },
    {
      label: "Händler",
      icon: Store,
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-950/50",
      value: dealers,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded-xl border bg-card p-3 sm:p-4 transition-shadow hover:shadow-card-hover">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
