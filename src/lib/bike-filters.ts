import type { Bike, BikeCategory } from "@/adapters/types";

export interface FilterValues {
  search: string;
  categories: BikeCategory[];
  priceMin: string;
  priceMax: string;
  /** @deprecated use dealers[] instead — kept for backward compat */
  dealer: string;
  dealers: string[];
  /** @deprecated use brands[] instead — kept for backward compat */
  brand: string;
  brands: string[];
  onlyDiscounted: boolean;
  availability: string;
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
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.brand.toLowerCase().includes(q) ||
        b.dealer.toLowerCase().includes(q)
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

  // Multi-dealer filter (new) takes precedence over legacy single dealer
  if (filters.dealers.length > 0) {
    result = result.filter((b) => filters.dealers.includes(b.dealer));
  } else if (filters.dealer) {
    result = result.filter((b) => b.dealer === filters.dealer);
  }

  // Multi-brand filter (new) takes precedence over legacy single brand
  if (filters.brands.length > 0) {
    result = result.filter((b) => filters.brands.includes(b.brand));
  } else if (filters.brand) {
    result = result.filter((b) => b.brand === filters.brand);
  }

  if (filters.onlyDiscounted) {
    result = result.filter((b) => b.listPrice !== undefined && b.listPrice > b.price);
  }

  if (filters.availability) {
    result = result.filter((b) => b.availability === filters.availability);
  }

  switch (filters.sortBy) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      result.sort((a, b) => a.name.localeCompare(b.name, "de"));
      break;
    case "name-desc":
      result.sort((a, b) => b.name.localeCompare(a.name, "de"));
      break;
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
    case "discount-desc": {
      result.sort((a, b) => {
        const discountA =
          a.listPrice && a.listPrice > a.price
            ? (a.listPrice - a.price) / a.listPrice
            : -1;
        const discountB =
          b.listPrice && b.listPrice > b.price
            ? (b.listPrice - b.price) / b.listPrice
            : -1;
        return discountB - discountA;
      });
      break;
    }
    case "discount-abs-desc": {
      result.sort((a, b) => {
        const absA = a.listPrice && a.listPrice > a.price ? a.listPrice - a.price : -1;
        const absB = b.listPrice && b.listPrice > b.price ? b.listPrice - b.price : -1;
        return absB - absA;
      });
      break;
    }
  }

  return result;
}
