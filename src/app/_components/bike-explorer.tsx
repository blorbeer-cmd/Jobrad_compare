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
import { RefreshCw, AlertTriangle, Heart, GitCompareArrows, Search, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDataAge } from "@/lib/freshness";
import { groupBikes, summarizeResolution } from "@/lib/entity-resolution";
import { BikeGroupCard } from "@/components/bikes/bike-group-card";
import { useTaxProfile } from "@/lib/use-tax-profile";
import { calculateBikeLease, estimateMonthlyGrossRate } from "@/lib/tax";

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

  const savedKeys = useMemo(() => {
    const keys = new Map<string, string>();
    for (const sb of savedBikes) {
      keys.set(bikeKey(sb.bikeData), sb.id);
    }
    return keys;
  }, [savedBikes]);

  const loadBikes = useCallback(async (refresh = false) => {
    setFetchState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = refresh ? "/api/bikes?refresh=true&limit=200" : "/api/bikes?limit=200";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Bitte melde dich an, um Fahrräder zu durchsuchen.");
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

  const { profile, activeProfile } = useTaxProfile();

  const allBikes = fetchState.bikes;
  const availableDealers = useMemo(() => [...new Set(allBikes.map((b) => b.dealer))].sort(), [allBikes]);
  const availableBrands = useMemo(() => [...new Set(allBikes.map((b) => b.brand))].sort(), [allBikes]);

  const netRates = useMemo(() => {
    const map = new Map<string, number>();
    for (const bike of allBikes) {
      const listPrice = bike.listPrice ?? bike.price;
      const monthlyGrossRate = estimateMonthlyGrossRate(listPrice, 36);
      const result = calculateBikeLease(activeProfile, { listPrice, monthlyGrossRate });
      map.set(bikeKey(bike), result.monthlyNetRate);
    }
    return map;
  }, [allBikes, activeProfile]);

  const filteredBikes = useMemo(
    () => filterAndSortBikes(allBikes, filters, netRates),
    [allBikes, filters, netRates]
  );

  const lowestNetRateKey = useMemo(() => {
    if (filteredBikes.length === 0) return undefined;
    let minRate = Infinity;
    let minKey: string | undefined;
    for (const bike of filteredBikes) {
      const key = bikeKey(bike);
      const rate = netRates.get(key) ?? bike.price;
      if (rate < minRate) { minRate = rate; minKey = key; }
    }
    return minKey;
  }, [filteredBikes, netRates]);

  const bikeGroups = useMemo(() => groupBikes(allBikes), [allBikes]);
  const resolution = useMemo(() => summarizeResolution(bikeGroups), [bikeGroups]);

  async function toggleSave(bike: Bike) {
    const key = bikeKey(bike);
    const existingId = savedKeys.get(key);

    if (existingId) {
      setSavedBikes((prev) => prev.filter((sb) => sb.id !== existingId));
      try {
        const res = await fetch(`/api/saved-bikes/${existingId}`, { method: "DELETE" });
        if (!res.ok) loadSavedBikes();
      } catch {
        loadSavedBikes();
      }
    } else {
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
          setSavedBikes((prev) =>
            prev.map((sb) => (sb.id === tempRecord.id ? data.savedBike : sb))
          );
        } else if (res.status === 409) {
          loadSavedBikes();
        } else {
          setSavedBikes((prev) => prev.filter((sb) => sb.id !== tempRecord.id));
        }
      } catch {
        setSavedBikes((prev) => prev.filter((sb) => sb.id !== tempRecord.id));
      }
    }
  }

  async function updateNote(savedBikeId: string, note: string | null) {
    setSavedBikes((prev) =>
      prev.map((sb) => (sb.id === savedBikeId ? { ...sb, note } : sb))
    );
    try {
      const res = await fetch(`/api/saved-bikes/${savedBikeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) loadSavedBikes();
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
    <Tabs defaultValue="browse" className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TabsList className="h-10 rounded-lg p-1">
          <TabsTrigger value="browse" className="gap-1.5 text-sm rounded-md">
            <Search className="h-3.5 w-3.5" />
            Durchsuchen
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-1.5 text-sm rounded-md">
            <Heart className="h-3.5 w-3.5" />
            Favoriten
            {savedBikes.length > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {savedBikes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5 text-sm rounded-md">
            <GitCompareArrows className="h-3.5 w-3.5" />
            Vergleich
            {compareBikes.length > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {compareBikes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5 text-sm rounded-md">
            <Layers className="h-3.5 w-3.5" />
            Modelle
            {resolution.multiDealerGroups > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {resolution.multiDealerGroups}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Cache info + refresh on desktop */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          {fetchState.fetchedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Daten {formatDataAge(fetchState.fetchedAt)}
              {fetchState.fromCache && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">Cache</span>
              )}
            </span>
          )}
          {fetchState.errors.length > 0 && (
            <span
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 cursor-help"
              title={fetchState.errors.map((e) => `${e.dealer}: ${e.error}`).join("\n")}
            >
              <AlertTriangle className="h-3 w-3" />
              {fetchState.errors.length} Quelle(n) nicht erreichbar
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadBikes(true)}
            disabled={fetchState.loading}
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3 w-3", fetchState.loading && "animate-spin")} />
            Aktualisieren
          </Button>
        </div>
      </div>

      <TabsContent value="browse" className="space-y-4 mt-0">
        {fetchState.error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <p className="mt-4 font-medium">{fetchState.error}</p>
            <Button variant="outline" className="mt-4" onClick={() => loadBikes()}>
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <>
            <StatsBar bikes={filteredBikes} totalCount={allBikes.length} loading={fetchState.loading} />

            {/* Mobile filter + refresh row */}
            <div className="flex items-center gap-2 lg:hidden">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                availableDealers={availableDealers}
                availableBrands={availableBrands}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadBikes(true)}
                disabled={fetchState.loading}
                className="ml-auto gap-1.5 text-xs sm:hidden"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", fetchState.loading && "animate-spin")} />
                Aktualisieren
              </Button>
            </div>

            <div className="flex gap-6">
              {/* Desktop filter sidebar */}
              <div className="hidden lg:block">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableDealers={availableDealers}
                  availableBrands={availableBrands}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {!profile && (
                  <div className="rounded-lg border border-dashed px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                    <span>Netto-Raten basieren auf Standardwerten (45.000 € Jahresgehalt, SK 1).</span>
                    <span className="text-xs">Passe dein Steuerprofil im Rechner an.</span>
                  </div>
                )}
                <BikeGrid
                  bikes={filteredBikes}
                  savedBikeKeys={savedKeySet}
                  comparingKeys={comparingKeys}
                  onToggleSave={toggleSave}
                  onCompare={toggleCompare}
                  loading={fetchState.loading}
                  netRates={netRates}
                  lowestNetRateKey={lowestNetRateKey}
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

      <TabsContent value="favorites" className="mt-0">
        {savedLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : savedBikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Heart className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="mt-4 font-semibold">Keine Favoriten gespeichert</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              Klicke auf das Herz-Symbol bei einem Fahrrad, um es hier zu speichern.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <TabsContent value="compare" className="mt-0">
        <ComparisonView
          bikes={compareBikes}
          onRemove={(bike) => toggleCompare(bike)}
          onClear={() => setCompareBikes([])}
        />
      </TabsContent>

      <TabsContent value="models" className="mt-0 space-y-4">
        {fetchState.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : bikeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Layers className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="mt-4 font-semibold">Keine Modelle gefunden</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              Lade Fahrräder, um die Modellübersicht zu sehen.
            </p>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            {resolution.multiDealerGroups > 0 && (
              <div className="rounded-xl border bg-primary/5 px-4 py-3 text-sm">
                <span className="font-semibold">{resolution.multiDealerGroups} Modell{resolution.multiDealerGroups !== 1 ? "e" : ""}</span>
                {" "}bei mehreren Händlern erhältlich
                {resolution.maxSavings !== null && resolution.maxSavings > 0 && (
                  <span className="text-muted-foreground">
                    {" "}— bis zu{" "}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {resolution.maxSavings.toLocaleString("de-DE")} €
                    </span>{" "}
                    Preisunterschied
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {bikeGroups.map((group) => (
                <BikeGroupCard key={group.canonicalKey} group={group} />
              ))}
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
