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
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

function bikeKey(bike: Bike) {
  return `${bike.dealer}:${bike.name}`;
}

export function BikeExplorer() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [compareBikes, setCompareBikes] = useState<Bike[]>([]);
  const [allBikes, setAllBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchInfo, setFetchInfo] = useState<{ fromCache: boolean; fetchedAt: string; errors: { dealer: string; error: string }[] } | null>(null);

  const loadBikes = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = refresh ? "/api/bikes?refresh=true" : "/api/bikes";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllBikes(data.bikes);
      setFetchInfo({ fromCache: data.fromCache, fetchedAt: data.fetchedAt, errors: data.errors });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

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
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="browse">Durchsuchen</TabsTrigger>
          <TabsTrigger value="compare">
            Vergleich{compareBikes.length > 0 && ` (${compareBikes.length})`}
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {fetchInfo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {fetchInfo.fromCache && <Badge variant="outline">Cache</Badge>}
              {fetchInfo.errors.length > 0 && (
                <Badge variant="warning">{fetchInfo.errors.length} Fehler</Badge>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBikes(true)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Fehler beim Laden der Daten: {error}
        </div>
      )}

      <TabsContent value="browse" className="space-y-6">
        <StatsBar bikes={filteredBikes} totalCount={allBikes.length} />

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
              loading={loading}
            />
          </div>
        </div>

        <ComparisonBar
          bikes={compareBikes}
          onRemove={(bike) => toggleCompare(bike)}
          onCompare={() => {}}
        />
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
