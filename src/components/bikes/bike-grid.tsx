import type { Bike } from "@/adapters/types";
import { BikeCard } from "./bike-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface BikeGridProps {
  bikes: Bike[];
  savedBikeKeys?: Set<string>;
  comparingKeys?: Set<string>;
  onToggleSave?: (bike: Bike) => void;
  onCompare?: (bike: Bike) => void;
  loading?: boolean;
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
}: BikeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <div className="space-y-2 px-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Search className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="mt-4 font-semibold">Keine Fahrräder gefunden</p>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
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
          />
        );
      })}
    </div>
  );
}
