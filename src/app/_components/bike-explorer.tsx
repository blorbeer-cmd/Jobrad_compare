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
import { RefreshCw, AlertTriangle, Heart, GitCompareArrows, Search, Clock, Layers, X, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, uniqueSortedStrings } from "@/lib/utils";
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
      const url = refresh ? "/api/bikes?refresh=true&limit=500" : "/api/bikes?limit=500";
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

  const availableDealers = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.dealer), [allBikes]);
  const availableBrands = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.brand), [allBikes]);
  const availableAvailabilities = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.availability ?? null), [allBikes]);
  const availableFrameSizes = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.frameSize ?? null), [allBikes]);
  const availableWheelSizes = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.wheelSize ?? null), [allBikes]);
  const availableFrameMaterials = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.frameMaterial ?? null), [allBikes]);
  const availableDriveTypes = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.driveType ?? null), [allBikes]);
  const availableSuspensions = useMemo(() => uniqueSortedStrings(allBikes, (b) => b.suspension ?? null), [allBikes]);
  const availableModelYears = useMemo(
    () =>
      [...new Set(allBikes.map((b) => b.modelYear).filter((y): y is number => y !== undefined))]
        .sort((a, b) => b - a)
        .map(String),
    [allBikes]
  );
  const hasBatteryData = useMemo(() => allBikes.some((b) => b.batteryWh != null), [allBikes]);

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
    <Tabs defaultValue="browse" className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        {/* Tabs: icon-only on mobile, icon+label on sm+ */}
        <TabsList className="h-11 rounded-xl p-1 grid grid-cols-4 flex-1 sm:flex-none sm:inline-flex sm:w-auto bg-muted/70">
          <TabsTrigger value="browse" className="gap-1.5 rounded-lg px-2 sm:gap-2 sm:px-4 data-[state=active]:shadow-sm">
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-sm">Durchsuchen</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-1.5 rounded-lg px-2 sm:gap-2 sm:px-4 data-[state=active]:shadow-sm">
            <Heart className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-sm">Favoriten</span>
            {savedBikes.length > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {savedBikes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5 rounded-lg px-2 sm:gap-2 sm:px-4 data-[state=active]:shadow-sm">
            <GitCompareArrows className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-sm">Vergleich</span>
            {compareBikes.length > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {compareBikes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5 rounded-lg px-2 sm:gap-2 sm:px-4 data-[state=active]:shadow-sm">
            <Layers className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-sm">Modelle</span>
            {resolution.multiDealerGroups > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {resolution.multiDealerGroups}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Cache info + refresh — desktop only */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs text-muted-foreground ml-auto">
          {fetchState.fetchedAt && (
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5">
              <Clock className="h-3 w-3" />
              Daten {formatDataAge(fetchState.fetchedAt)}
              {fetchState.fromCache && (
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium">Cache</span>
              )}
            </span>
          )}
          {fetchState.errors.length > 0 && (
            <span
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 cursor-help"
              title={fetchState.errors.map((e) => `${e.dealer}: ${e.error}`).join("\n")}
            >
              <AlertTriangle className="h-3 w-3" />
              {fetchState.errors.length} Quelle(n) nicht erreichbar
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBikes(true)}
            disabled={fetchState.loading}
            className="h-8 gap-1.5 text-xs rounded-lg"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", fetchState.loading && "animate-spin")} />
            Aktualisieren
          </Button>
        </div>
      </div>

      <TabsContent value="browse" className="space-y-4 mt-0">
        {fetchState.error ? (
          <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border-2 border-destructive/20 bg-destructive/5 py-20 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <p className="mt-5 text-lg font-semibold">{fetchState.error}</p>
            <Button variant="outline" className="mt-5" onClick={() => loadBikes()}>
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <>
            <StatsBar bikes={filteredBikes} totalCount={allBikes.length} loading={fetchState.loading} />

            {/* Mobile: search bar + filter button + refresh */}
            <div className="flex flex-col gap-2 lg:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Fahrrad, Marke, Händler, Motor..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className={cn("h-10 pl-9", filters.search && "pr-9")}
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                    aria-label="Suche löschen"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableDealers={availableDealers}
                  availableBrands={availableBrands}
                  availableAvailabilities={availableAvailabilities}
                  availableFrameSizes={availableFrameSizes}
                  availableWheelSizes={availableWheelSizes}
                  availableFrameMaterials={availableFrameMaterials}
                  availableModelYears={availableModelYears}
                  availableDriveTypes={availableDriveTypes}
                  availableSuspensions={availableSuspensions}
                  hasBatteryData={hasBatteryData}
                />
                {fetchState.fetchedAt && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatDataAge(fetchState.fetchedAt)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadBikes(true)}
                  disabled={fetchState.loading}
                  className="ml-auto gap-1.5 text-xs"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", fetchState.loading && "animate-spin")} />
                  <span className="hidden xs:inline sm:inline">Aktualisieren</span>
                </Button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Desktop filter sidebar */}
              <div className="hidden lg:block">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableDealers={availableDealers}
                  availableBrands={availableBrands}
                  availableAvailabilities={availableAvailabilities}
                  availableFrameSizes={availableFrameSizes}
                  availableWheelSizes={availableWheelSizes}
                  availableFrameMaterials={availableFrameMaterials}
                  availableModelYears={availableModelYears}
                  availableDriveTypes={availableDriveTypes}
                  availableSuspensions={availableSuspensions}
                  hasBatteryData={hasBatteryData}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {!profile && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Calculator className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span>Netto-Raten basieren auf Standardwerten.</span>{" "}
                      <span className="text-xs">Passe dein Steuerprofil im Rechner an für genaue Werte.</span>
                    </div>
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
          <div className="flex items-center justify-center py-20" role="status" aria-label="Favoriten werden geladen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : savedBikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-24 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Heart className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-5 text-lg font-semibold">Keine Favoriten gespeichert</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
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
          <div className="flex items-center justify-center py-20" role="status" aria-label="Modelle werden geladen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : bikeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-24 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Layers className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-5 text-lg font-semibold">Keine Modelle gefunden</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
              Lade Fahrräder, um die Modellübersicht zu sehen.
            </p>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            {resolution.multiDealerGroups > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Layers className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold">{resolution.multiDealerGroups} Modell{resolution.multiDealerGroups !== 1 ? "e" : ""}</span>
                  {" "}bei mehreren Händlern erhältlich
                  {resolution.maxSavings !== null && resolution.maxSavings > 0 && (
                    <span className="text-muted-foreground">
                      {" "}— bis zu{" "}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {resolution.maxSavings.toLocaleString("de-DE")} €
                      </span>{" "}
                      Preisunterschied
                    </span>
                  )}
                </div>
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
