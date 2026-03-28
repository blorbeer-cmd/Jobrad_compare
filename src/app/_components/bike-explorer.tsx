"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Bike } from "@/adapters/types";
import { BikeGrid } from "@/components/bikes/bike-grid";
import { FilterSidebar, defaultFilters, type FilterValues } from "@/components/bikes/filter-sidebar";
import { ComparisonView } from "@/components/bikes/comparison-view";
import { ComparisonBar } from "@/components/bikes/comparison-bar";
import { StatsBar } from "@/components/bikes/stats-bar";
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
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [compareBikes, setCompareBikes] = useState<Bike[]>([]);

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

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  const allBikes = fetchState.bikes;

  const availableDealers = useMemo(() => [...new Set(allBikes.map((b) => b.dealer))].sort(), [allBikes]);
  const availableBrands = useMemo(() => [...new Set(allBikes.map((b) => b.brand))].sort(), [allBikes]);

  const filteredBikes = useMemo(() => {
    let result = [...allBikes];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q)
      );
    }
    if (filters.categories.length > 0) {
      result = result.filter((b) => filters.categories.includes(b.category));
    }
    if (filters.priceMin) {
      result = result.filter((b) => b.price >= Number(filters.priceMin));
    }
    if (filters.priceMax) {
      result = result.filter((b) => b.price <= Number(filters.priceMax));
    }
    if (filters.dealer) {
      result = result.filter((b) => b.dealer === filters.dealer);
    }
    if (filters.brand) {
      result = result.filter((b) => b.brand === filters.brand);
    }

    switch (filters.sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name, "de")); break;
      case "name-desc": result.sort((a, b) => b.name.localeCompare(a.name, "de")); break;
    }

    return result;
  }, [allBikes, filters]);

  function toggleSave(bike: Bike) {
    const key = bikeKey(bike);
    setSavedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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

  return (
    <Tabs defaultValue="browse">
      <TabsList>
        <TabsTrigger value="browse">Durchsuchen</TabsTrigger>
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
                  savedBikeKeys={savedKeys}
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
