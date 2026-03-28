"use client";

import { useState } from "react";
import type { BikeCategory } from "@/adapters/types";
import { type FilterValues } from "@/lib/bike-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { X, SlidersHorizontal } from "lucide-react";

export type { FilterValues };

const defaultFilters: FilterValues = {
  search: "",
  categories: [],
  priceMin: "",
  priceMax: "",
  dealer: "",
  brand: "",
  sortBy: "price-asc",
};

const allCategories: BikeCategory[] = [
  "E-Bike", "City", "Trekking", "Mountainbike", "Rennrad", "Cargo", "Gravel", "Kinder", "Sonstige",
];

const sortOptions = [
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
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium">Suche</label>
        <Input
          placeholder="Fahrrad suchen..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="mt-1.5"
        />
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <label className="text-sm font-medium">Kategorie</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <Badge
              key={cat}
              variant={filters.categories.includes(cat) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <label className="text-sm font-medium">Preis (&euro;)</label>
        <div className="mt-1.5 flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => update({ priceMin: e.target.value })}
          />
          <span className="flex items-center text-muted-foreground">&ndash;</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => update({ priceMax: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      {/* Dealer */}
      <div>
        <label className="text-sm font-medium">H\u00e4ndler</label>
        <Select
          className="mt-1.5"
          placeholder="Alle H\u00e4ndler"
          value={filters.dealer}
          onChange={(e) => update({ dealer: e.target.value })}
          options={availableDealers.map((d) => ({ value: d, label: d }))}
        />
      </div>

      {/* Brand */}
      <div>
        <label className="text-sm font-medium">Marke</label>
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
        <label className="text-sm font-medium">Sortierung</label>
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
      >
        <X className="mr-2 h-4 w-4" />
        Filter zur\u00fccksetzen
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setMobileOpen(!mobileOpen)} className="mb-4 w-full">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        {mobileOpen && (
          <div className="mb-6 rounded-lg border bg-card p-4">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 w-64 rounded-lg border bg-card p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-auto">{activeFilterCount}</Badge>
            )}
          </h3>
          {filterContent}
        </div>
      </aside>
    </>
  );
}

export { defaultFilters };
