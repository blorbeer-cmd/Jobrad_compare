import type { Bike } from "@/adapters/types";
import { BikeCard } from "./bike-card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (bikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <svg className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p className="mt-4 text-lg font-medium">Keine Fahrr\u00e4der gefunden</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Passe deine Filter an oder versuche es sp\u00e4ter erneut.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
