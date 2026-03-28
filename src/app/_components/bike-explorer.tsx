"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Bike } from "@/adapters/types";
import { BikeGrid } from "@/components/bikes/bike-grid";
import { FilterSidebar, defaultFilters } from "@/components/bikes/filter-sidebar";
import { filterAndSortBikes, type FilterValues } from "@/lib/bike-filters";
import { ComparisonView } from "@/components/bikes/comparison-view";
import { ComparisonBar } from "@/components/bikes/comparison-bar";
import { StatsBar } from "@/components/bikes/stats-bar";
import { SavedBikeCard } from "@/components/bikes/saved-bike-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface FetchState {
  bikes: Bike[];
  errors: { dealer: string; error: string }[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  fetchedAt: string | null;
}

interface SavedBikeRecord {
  id: string;
  bikeData: Bike;
  dealer: string;
  note: string | null;
  createdAt: string;
}

function bikeKey(bike: Bike) {
  return `${bike.dealer}:${bike.name}`;
}

export function BikeExplorer() {
  const [fetchState, setFetchState] = useState<FetchState>({
    bikes: [],
    errors: [],
    loading: true,
    error: null,
    fromCache: false,
    fetchedAt: null,
  });
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [savedBikes, setSavedBikes] = useState<SavedBikeRecord[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [compareBikes, setCompareBikes] = useState<Bike[]>([]);

  // Derive savedKeys from savedBikes for quick lookup
  const savedKeys = useMemo(() => {
    const keys = new Map<string, string>(); // bikeKey -> savedBike.id
    for (const sb of savedBikes) {
      keys.set(bikeKey(sb.bikeData), sb.id);
    }
    return keys;
  }, [savedBikes]);

  const loadBikes = useCallback(async (refresh = false) => {
    setFetchState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = refresh ? "/api/bikes?refresh=true" : "/api/bikes";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Bitte melde dich an, um Fahrraeder zu durchsuchen.");
        }
        throw new Error(`Fehler beim Laden der Daten (${res.status})`);
      }
      const data = await res.json();
      setFetchState({
        bikes: data.bikes ?? [],
        errors: data.errors ?? [],
        loading: false,
        error: null,
        fromCache: data.fromCache ?? false,
        fetchedAt: data.fetchedAt ?? null,
      });
    } catch (err) {
      setFetchState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unbekannter Fehler beim Laden der Daten.",
      }));
    }
  }, []);

  const loadSavedBikes = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-bikes");
      if (res.ok) {
        const data = await res.json();
        setSavedBikes(data.savedBikes ?? []);
      }
    } catch {
      // Silently fail — saved bikes are not critical for browsing
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBikes();
    loadSavedBikes();
  }, [loadBikes, loadSavedBikes]);

  const allBikes = fetchState.bikes;

  const availableDealers = useMemo(() => [...new Set(allBikes.map((b) => b.dealer))].sort(), [allBikes]);
  const availableBrands = useMemo(() => [...new Set(allBikes.map((b) => b.brand))].sort(), [allBikes]);

  const filteredBikes = useMemo(() => filterAndSortBikes(allBikes, filters), [allBikes, filters]);

  async function toggleSave(bike: Bike) {
    const key = bikeKey(bike);
    const existingId = savedKeys.get(key);

    if (existingId) {
      // Optimistic remove
      setSavedBikes((prev) => prev.filter((sb) => sb.id !== existingId));
      try {
        const res = await fetch(`/api/saved-bikes/${existingId}`, { method: "DELETE" });
        if (!res.ok) {
          // Revert on failure
          loadSavedBikes();
        }
      } catch {
        loadSavedBikes();
      }
    } else {
      // Optimistic add with temp ID
      const tempRecord: SavedBikeRecord = {
        id: `temp-${Date.now()}`,
        bikeData: bike,
        dealer: bike.dealer,
        note: null,
        createdAt: new Date().toISOString(),
      };
      setSavedBikes((prev) => [tempRecord, ...prev]);
      try {
        const res = await fetch("/api/saved-bikes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bikeData: bike }),
        });
        if (res.ok) {
          const data = await res.json();
          // Replace temp record with real one
          setSavedBikes((prev) =>
            prev.map((sb) => (sb.id === tempRecord.id ? data.savedBike : sb))
          );
        } else if (res.status === 409) {
          // Already saved — reload to sync
          loadSavedBikes();
        } else {
          // Revert
          setSavedBikes((prev) => prev.filter((sb) => sb.id !== tempRecord.id));
        }
      } catch {
        setSavedBikes((prev) => prev.filter((sb) => sb.id !== tempRecord.id));
      }
    }
  }

  async function updateNote(savedBikeId: string, note: string | null) {
    // Optimistic update
    setSavedBikes((prev) =>
      prev.map((sb) => (sb.id === savedBikeId ? { ...sb, note } : sb))
    );
    try {
      const res = await fetch(`/api/saved-bikes/${savedBikeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        loadSavedBikes();
      }
    } catch {
      loadSavedBikes();
    }
  }

  function toggleCompare(bike: Bike) {
    const key = bikeKey(bike);
    setCompareBikes((prev) => {
      if (prev.some((b) => bikeKey(b) === key)) {
        return prev.filter((b) => bikeKey(b) !== key);
      }
      if (prev.length >= 4) return prev;
      return [...prev, bike];
    });
  }

  const comparingKeys = new Set(compareBikes.map(bikeKey));
  const savedKeySet = new Set(savedKeys.keys());

  return (
    <Tabs defaultValue="browse">
      <TabsList>
        <TabsTrigger value="browse">Durchsuchen</TabsTrigger>
        <TabsTrigger value="favorites">
          Favoriten{savedBikes.length > 0 && ` (${savedBikes.length})`}
        </TabsTrigger>
        <TabsTrigger value="compare">
          Vergleich{compareBikes.length > 0 && ` (${compareBikes.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="browse" className="space-y-6">
        {fetchState.error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 py-16">
            <svg className="h-12 w-12 text-destructive/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="mt-4 text-lg font-medium">{fetchState.error}</p>
            <Button variant="outline" className="mt-4" onClick={() => loadBikes()}>
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <StatsBar bikes={filteredBikes} totalCount={allBikes.length} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {fetchState.fromCache && fetchState.fetchedAt && (
                  <span>Daten vom {new Date(fetchState.fetchedAt).toLocaleString("de-DE")}</span>
                )}
                {fetchState.errors.length > 0 && (
                  <span className="text-amber-600" title={fetchState.errors.map((e) => `${e.dealer}: ${e.error}`).join("\n")}>
                    {fetchState.errors.length} Quelle(n) nicht erreichbar
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadBikes(true)}
                  disabled={fetchState.loading}
                >
                  Aktualisieren
                </Button>
              </div>
            </div>

            <div className="flex gap-8">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                availableDealers={availableDealers}
                availableBrands={availableBrands}
              />
              <div className="flex-1">
                <BikeGrid
                  bikes={filteredBikes}
                  savedBikeKeys={savedKeySet}
                  comparingKeys={comparingKeys}
                  onToggleSave={toggleSave}
                  onCompare={toggleCompare}
                  loading={fetchState.loading}
                />
              </div>
            </div>

            <ComparisonBar
              bikes={compareBikes}
              onRemove={(bike) => toggleCompare(bike)}
              onCompare={() => {
                const tabsTrigger = document.querySelector('[data-tab="compare"]') as HTMLButtonElement;
                tabsTrigger?.click();
              }}
            />
          </>
        )}
      </TabsContent>

      <TabsContent value="favorites" className="space-y-6">
        {savedLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : savedBikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <svg className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <p className="mt-4 text-lg font-medium">Keine Favoriten gespeichert</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Klicke auf das Herz-Symbol bei einem Fahrrad, um es hier zu speichern.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedBikes.map((sb) => (
              <SavedBikeCard
                key={sb.id}
                savedBike={sb}
                onRemove={() => toggleSave(sb.bikeData)}
                onUpdateNote={(note) => updateNote(sb.id, note)}
                onCompare={() => toggleCompare(sb.bikeData)}
                isComparing={comparingKeys.has(bikeKey(sb.bikeData))}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="compare">
        <ComparisonView
          bikes={compareBikes}
          onRemove={(bike) => toggleCompare(bike)}
          onClear={() => setCompareBikes([])}
        />
      </TabsContent>
    </Tabs>
  );
}
