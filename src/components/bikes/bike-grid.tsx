import type { Bike } from "@/adapters/types";
import { BikeCard } from "./bike-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

interface BikeGridProps {
  bikes: Bike[];
  savedBikeKeys?: Set<string>;
  comparingKeys?: Set<string>;
  onToggleSave?: (bike: Bike) => void;
  onCompare?: (bike: Bike) => void;
  loading?: boolean;
  netRates?: Map<string, number>;
  lowestNetRateKey?: string;
}

function bikeKey(bike: Bike) {
  return `${bike.dealer}:${bike.name}`;
}

export function BikeGrid({
  bikes,
  savedBikeKeys,
  comparingKeys,
  onToggleSave,
  onCompare,
  loading,
  netRates,
  lowestNetRateKey,
}: BikeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-2.5 p-4">
              <Skeleton className="h-3 w-1/4 rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
              <Skeleton className="h-7 w-1/3 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-24 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <SearchX className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="mt-5 text-lg font-semibold">Keine Fahrräder gefunden</p>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
          Passe deine Filter an oder versuche es später erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {bikes.map((bike) => {
        const key = bikeKey(bike);
        return (
          <BikeCard
            key={key}
            bike={bike}
            isSaved={savedBikeKeys?.has(key)}
            isComparing={comparingKeys?.has(key)}
            onToggleSave={onToggleSave}
            onCompare={onCompare}
            monthlyNetRate={netRates?.get(key)}
            isLowestNetRate={lowestNetRateKey === key}
          />
        );
      })}
    </div>
  );
}
