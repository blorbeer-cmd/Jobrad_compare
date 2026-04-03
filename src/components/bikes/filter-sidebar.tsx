"use client";

import { useState } from "react";
import type { BikeCategory } from "@/adapters/types";
import { type FilterValues } from "@/lib/bike-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { X, SlidersHorizontal, Search } from "lucide-react";

export type { FilterValues };

const defaultFilters: FilterValues = {
  search: "",
  categories: [],
  priceMin: "",
  priceMax: "",
  dealer: "",
  brand: "",
  sortBy: "netrate-asc",
};

const allCategories: BikeCategory[] = [
  "E-Bike", "City", "Trekking", "Mountainbike", "Rennrad", "Cargo", "Gravel", "Kinder", "Sonstige",
];

const sortOptions = [
  { value: "netrate-asc", label: "Netto-Rate aufsteigend" },
  { value: "netrate-desc", label: "Netto-Rate absteigend" },
  { value: "price-asc", label: "Preis aufsteigend" },
  { value: "price-desc", label: "Preis absteigend" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

interface FilterSidebarProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  availableDealers: string[];
  availableBrands: string[];
}

export function FilterSidebar({ filters, onFiltersChange, availableDealers, availableBrands }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCategory(cat: BikeCategory) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: next });
  }

  function update(partial: Partial<FilterValues>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const activeFilterCount =
    filters.categories.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.dealer ? 1 : 0) +
    (filters.brand ? 1 : 0);

  const filterContent = (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-foreground">Suche</label>
        <div className="relative mt-1.5">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Fahrrad suchen..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <label className="text-sm font-medium text-foreground">Kategorie</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={
                filters.categories.includes(cat)
                  ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground transition-colors"
                  : "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border bg-background text-foreground hover:bg-muted transition-colors"
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <label className="text-sm font-medium text-foreground">Preis (&euro;)</label>
        <div className="mt-1.5 flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => update({ priceMin: e.target.value })}
            className="w-0 flex-1"
          />
          <span className="text-muted-foreground text-sm shrink-0">&ndash;</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => update({ priceMax: e.target.value })}
            className="w-0 flex-1"
          />
        </div>
      </div>

      <Separator />

      {/* Dealer */}
      <div>
        <label className="text-sm font-medium text-foreground">Händler</label>
        <Select
          className="mt-1.5"
          placeholder="Alle Händler"
          value={filters.dealer}
          onChange={(e) => update({ dealer: e.target.value })}
          options={availableDealers.map((d) => ({ value: d, label: d }))}
        />
      </div>

      {/* Brand */}
      <div>
        <label className="text-sm font-medium text-foreground">Marke</label>
        <Select
          className="mt-1.5"
          placeholder="Alle Marken"
          value={filters.brand}
          onChange={(e) => update({ brand: e.target.value })}
          options={availableBrands.map((b) => ({ value: b, label: b }))}
        />
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-foreground">Sortierung</label>
        <Select
          className="mt-1.5"
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value })}
          options={sortOptions}
        />
      </div>

      <Separator />

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => onFiltersChange(defaultFilters)}
        disabled={activeFilterCount === 0 && !filters.search}
      >
        <X className="mr-2 h-4 w-4" />
        Filter zurücksetzen
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setMobileOpen(true)}
          className="gap-2"
          size="sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Sheet
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Filter"
        >
          {filterContent}
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-[4.5rem] w-60 rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Filter
            </h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} aktiv
              </Badge>
            )}
          </div>
          {filterContent}
        </div>
      </aside>
    </>
  );
}

export { defaultFilters };
