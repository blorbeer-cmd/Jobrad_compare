"use client";

import { useState, useMemo } from "react";
import type { Bike } from "@/adapters/types";
import { BikeGrid } from "@/components/bikes/bike-grid";
import { FilterSidebar, defaultFilters, type FilterValues } from "@/components/bikes/filter-sidebar";
import { ComparisonView } from "@/components/bikes/comparison-view";
import { ComparisonBar } from "@/components/bikes/comparison-bar";
import { StatsBar } from "@/components/bikes/stats-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Demo data — will be replaced by real adapter data in Phase 4
const demoBikes: Bike[] = [
  {
    name: "Cube Touring Hybrid ONE 625",
    brand: "Cube",
    category: "E-Bike",
    price: 2799,
    dealer: "Fahrrad XXL",
    dealerUrl: "https://example.com/cube-touring",
    imageUrl: "",
    availability: "Sofort verf\u00fcgbar",
  },
  {
    name: "Canyon Roadlite CF 7",
    brand: "Canyon",
    category: "Rennrad",
    price: 1899,
    dealer: "Canyon Direct",
    dealerUrl: "https://example.com/canyon-roadlite",
    imageUrl: "",
    availability: "2-3 Wochen",
  },
  {
    name: "Kalkhoff Endeavour 5.B Move+",
    brand: "Kalkhoff",
    category: "E-Bike",
    price: 3499,
    dealer: "Lucky Bike",
    dealerUrl: "https://example.com/kalkhoff",
    imageUrl: "",
    availability: "Sofort verf\u00fcgbar",
  },
  {
    name: "Stevens Trekking E-14",
    brand: "Stevens",
    category: "Trekking",
    price: 3199,
    dealer: "Fahrrad XXL",
    dealerUrl: "https://example.com/stevens",
    imageUrl: "",
  },
  {
    name: "Bergamont Revox 3",
    brand: "Bergamont",
    category: "Mountainbike",
    price: 799,
    dealer: "Lucky Bike",
    dealerUrl: "https://example.com/bergamont",
    imageUrl: "",
    availability: "Sofort verf\u00fcgbar",
  },
  {
    name: "Riese & M\u00fcller Load 75",
    brand: "Riese & M\u00fcller",
    category: "Cargo",
    price: 5999,
    dealer: "Radwelt",
    dealerUrl: "https://example.com/rm-load",
    imageUrl: "",
    availability: "Auf Anfrage",
  },
  {
    name: "Specialized Diverge E5",
    brand: "Specialized",
    category: "Gravel",
    price: 1499,
    dealer: "Fahrrad XXL",
    dealerUrl: "https://example.com/diverge",
    imageUrl: "",
    availability: "Sofort verf\u00fcgbar",
  },
  {
    name: "Puky Cyke 20-3",
    brand: "Puky",
    category: "Kinder",
    price: 399,
    dealer: "Lucky Bike",
    dealerUrl: "https://example.com/puky",
    imageUrl: "",
    availability: "Sofort verf\u00fcgbar",
  },
];

function bikeKey(bike: Bike) {
  return `${bike.dealer}:${bike.name}`;
}

export function BikeExplorer() {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [compareBikes, setCompareBikes] = useState<Bike[]>([]);

  const allBikes = demoBikes;

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
