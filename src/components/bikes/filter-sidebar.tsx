"use client";

import { useState, useEffect, useRef } from "react";
import type { BikeCategory } from "@/adapters/types";
import { type FilterValues } from "@/lib/bike-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { X, SlidersHorizontal, Search, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type { FilterValues };

export const defaultFilters: FilterValues = {
  search: "",
  categories: [],
  priceMin: "",
  priceMax: "",
  dealer: "",
  dealers: [],
  brand: "",
  brands: [],
  onlyDiscounted: false,
  availability: "",
  frameSizes: [],
  wheelSizes: [],
  driveTypes: [],
  suspensions: [],
  batteryWhMin: "",
  batteryWhMax: "",
  frameMaterials: [],
  modelYears: [],
  sortBy: "netrate-asc",
};

const allCategories: BikeCategory[] = [
  "E-Bike", "City", "Trekking", "Mountainbike", "Rennrad", "Cargo", "Gravel", "Kinder", "Sonstige",
];

const DRIVE_TYPE_LABELS: Record<string, string> = {
  chain: "Kette",
  belt: "Riemen",
  shaft: "Kardan",
};

const SUSPENSION_LABELS: Record<string, string> = {
  rigid: "Starr",
  front: "Federgabel",
  hardtail: "Hardtail",
  fully: "Fully",
};

const sortOptions = [
  { value: "netrate-asc", label: "Netto-Rate aufsteigend" },
  { value: "netrate-desc", label: "Netto-Rate absteigend" },
  { value: "price-asc", label: "Preis aufsteigend" },
  { value: "price-desc", label: "Preis absteigend" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "discount-desc", label: "Größter Rabatt (%) zuerst" },
  { value: "discount-abs-desc", label: "Größter Rabatt (€) zuerst" },
  { value: "battery-desc", label: "Größte Akkukapazität zuerst" },
  { value: "year-desc", label: "Neuestes Modelljahr zuerst" },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border bg-background text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function PillGroup({
  label,
  items,
  selected,
  onToggle,
  labelMap,
  initialVisible = 8,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  labelMap?: Record<string, string>;
  initialVisible?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialVisible);
  const hasMore = items.length > initialVisible;

  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((item) => (
          <Pill
            key={item}
            label={labelMap?.[item] ?? item}
            active={selected.includes(item)}
            onClick={() => onToggle(item)}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" />weniger</>
            ) : (
              <><ChevronDown className="h-3 w-3" />+{items.length - initialVisible} weitere</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/** Collapsible filter section with a header toggle. */
function FilterSection({
  title,
  activeCount,
  defaultOpen = false,
  children,
}: {
  title: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export interface FilterSidebarProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  availableDealers: string[];
  availableBrands: string[];
  availableAvailabilities?: string[];
  availableFrameSizes?: string[];
  availableWheelSizes?: string[];
  availableFrameMaterials?: string[];
  availableModelYears?: string[];
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  availableDealers,
  availableBrands,
  availableAvailabilities = [],
  availableFrameSizes = [],
  availableWheelSizes = [],
  availableFrameMaterials = [],
  availableModelYears = [],
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local search input in sync when filters are reset externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 150);
  }

  function update(partial: Partial<FilterValues>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function toggleItem(
    field: "categories" | "dealers" | "brands" | "frameSizes" | "wheelSizes" | "driveTypes" | "suspensions" | "frameMaterials" | "modelYears",
    value: string
  ) {
    const current = filters[field] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [field]: next });
  }

  const activeFilterCount =
    filters.categories.length +
    filters.dealers.length +
    filters.brands.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.onlyDiscounted ? 1 : 0) +
    (filters.availability ? 1 : 0) +
    filters.frameSizes.length +
    filters.wheelSizes.length +
    filters.driveTypes.length +
    filters.suspensions.length +
    (filters.batteryWhMin ? 1 : 0) +
    (filters.batteryWhMax ? 1 : 0) +
    filters.frameMaterials.length +
    filters.modelYears.length +
    (filters.dealer && filters.dealers.length === 0 ? 1 : 0) +
    (filters.brand && filters.brands.length === 0 ? 1 : 0);

  const technicalActiveCount =
    filters.frameSizes.length +
    filters.wheelSizes.length +
    filters.driveTypes.length +
    filters.suspensions.length +
    (filters.batteryWhMin ? 1 : 0) +
    (filters.batteryWhMax ? 1 : 0) +
    filters.frameMaterials.length +
    filters.modelYears.length;

  const filterContent = (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-foreground">Suche</label>
        <div className="relative mt-1.5">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Fahrrad, Marke, Händler, Motor..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn("pl-9", searchInput ? "pr-8" : "")}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Suche löschen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Nur reduzierte Angebote */}
      <button
        onClick={() => update({ onlyDiscounted: !filters.onlyDiscounted })}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
          filters.onlyDiscounted
            ? "border-primary bg-primary/10 text-primary font-medium"
            : "bg-background hover:bg-muted"
        )}
      >
        <Tag className={cn("h-4 w-4 shrink-0", filters.onlyDiscounted ? "text-primary" : "text-muted-foreground")} />
        Nur reduzierte Angebote
        {filters.onlyDiscounted && <X className="ml-auto h-3.5 w-3.5 shrink-0" />}
      </button>

      <Separator />

      {/* Kategorie — always open */}
      <FilterSection title="Kategorie" activeCount={filters.categories.length} defaultOpen>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <Pill
              key={cat}
              label={cat}
              active={filters.categories.includes(cat)}
              onClick={() => toggleItem("categories", cat)}
            />
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Preis */}
      <FilterSection
        title="Preis (€)"
        activeCount={(filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0)}
        defaultOpen
      >
        <div className="flex gap-2 items-center">
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
      </FilterSection>

      <Separator />

      {/* Händler */}
      {availableDealers.length > 0 && (
        <>
          <FilterSection title="Händler" activeCount={filters.dealers.length} defaultOpen>
            <PillGroup
              label=""
              items={availableDealers}
              selected={filters.dealers}
              onToggle={(d) => toggleItem("dealers", d)}
              initialVisible={6}
            />
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Marke */}
      {availableBrands.length > 0 && (
        <>
          <FilterSection title="Marke" activeCount={filters.brands.length} defaultOpen={false}>
            <PillGroup
              label=""
              items={availableBrands}
              selected={filters.brands}
              onToggle={(b) => toggleItem("brands", b)}
              initialVisible={8}
            />
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Technische Details — collapsible, closed by default */}
      <FilterSection title="Technische Details" activeCount={technicalActiveCount} defaultOpen={technicalActiveCount > 0}>
        <div className="space-y-4">

          {/* Rahmengröße */}
          {availableFrameSizes.length > 0 && (
            <PillGroup
              label="Rahmengröße"
              items={availableFrameSizes}
              selected={filters.frameSizes}
              onToggle={(s) => toggleItem("frameSizes", s)}
              initialVisible={8}
            />
          )}

          {/* Laufradgröße */}
          {availableWheelSizes.length > 0 && (
            <PillGroup
              label="Laufradgröße"
              items={availableWheelSizes}
              selected={filters.wheelSizes}
              onToggle={(s) => toggleItem("wheelSizes", s)}
              initialVisible={6}
            />
          )}

          {/* Antrieb */}
          <PillGroup
            label="Antrieb"
            items={["chain", "belt", "shaft"]}
            selected={filters.driveTypes}
            onToggle={(d) => toggleItem("driveTypes", d)}
            labelMap={DRIVE_TYPE_LABELS}
            initialVisible={3}
          />

          {/* Federung */}
          <PillGroup
            label="Federung"
            items={["rigid", "front", "hardtail", "fully"]}
            selected={filters.suspensions}
            onToggle={(s) => toggleItem("suspensions", s)}
            labelMap={SUSPENSION_LABELS}
            initialVisible={4}
          />

          {/* Akku (E-Bike) */}
          <div>
            <label className="text-sm font-medium text-foreground">Akkukapazität (Wh)</label>
            <div className="mt-1.5 flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={filters.batteryWhMin}
                onChange={(e) => update({ batteryWhMin: e.target.value })}
                className="w-0 flex-1"
              />
              <span className="text-muted-foreground text-sm shrink-0">&ndash;</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.batteryWhMax}
                onChange={(e) => update({ batteryWhMax: e.target.value })}
                className="w-0 flex-1"
              />
            </div>
          </div>

          {/* Rahmenmaterial */}
          {availableFrameMaterials.length > 0 && (
            <PillGroup
              label="Rahmenmaterial"
              items={availableFrameMaterials}
              selected={filters.frameMaterials}
              onToggle={(m) => toggleItem("frameMaterials", m)}
              initialVisible={6}
            />
          )}

          {/* Modelljahr */}
          {availableModelYears.length > 0 && (
            <PillGroup
              label="Modelljahr"
              items={availableModelYears}
              selected={filters.modelYears}
              onToggle={(y) => toggleItem("modelYears", y)}
              initialVisible={6}
            />
          )}
        </div>
      </FilterSection>

      <Separator />

      {/* Verfügbarkeit */}
      {availableAvailabilities.length > 0 && (
        <>
          <FilterSection title="Verfügbarkeit" activeCount={filters.availability ? 1 : 0} defaultOpen={false}>
            <Select
              placeholder="Alle"
              value={filters.availability}
              onChange={(e) => update({ availability: e.target.value })}
              options={availableAvailabilities.map((a) => ({ value: a, label: a }))}
            />
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Sortierung */}
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
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          onClick={() => setMobileOpen(true)}
          className="h-10 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/25 px-1 text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Filter">
          {filterContent}
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-[4.5rem] w-60 overflow-y-auto max-h-[calc(100vh-5rem)] rounded-xl border bg-card p-4 shadow-sm">
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
