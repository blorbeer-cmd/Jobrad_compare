import type { Bike, BikeCategory } from "@/adapters/types";

export interface FilterValues {
  search: string;
  categories: BikeCategory[];
  priceMin: string;
  priceMax: string;
  dealer: string;
  brand: string;
  sortBy: string;
}

function bikeKey(bike: Bike) {
  return `${bike.dealer}:${bike.name}`;
}

export function filterAndSortBikes(
  bikes: Bike[],
  filters: FilterValues,
  netRates?: Map<string, number>
): Bike[] {
  let result = [...bikes];

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
    case "price-asc":  result.sort((a, b) => a.price - b.price); break;
    case "price-desc": result.sort((a, b) => b.price - a.price); break;
    case "name-asc":   result.sort((a, b) => a.name.localeCompare(b.name, "de")); break;
    case "name-desc":  result.sort((a, b) => b.name.localeCompare(a.name, "de")); break;
    case "netrate-asc":
      result.sort((a, b) =>
        (netRates?.get(bikeKey(a)) ?? a.price) - (netRates?.get(bikeKey(b)) ?? b.price)
      );
      break;
    case "netrate-desc":
      result.sort((a, b) =>
        (netRates?.get(bikeKey(b)) ?? b.price) - (netRates?.get(bikeKey(a)) ?? a.price)
      );
      break;
  }

  return result;
}
