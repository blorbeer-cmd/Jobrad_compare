import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract unique non-null values from a list, mapped by fn, sorted alphabetically. */
export function uniqueSortedStrings<T>(
  items: T[],
  fn: (item: T) => string | null | undefined
): string[] {
  return [...new Set(items.map(fn).filter((v): v is string => v != null))].sort();
}
