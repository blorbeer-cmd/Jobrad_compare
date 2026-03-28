import { z } from "zod";

export const BikeCategory = z.enum([
  "E-Bike",
  "City",
  "Trekking",
  "Mountainbike",
  "Rennrad",
  "Cargo",
  "Gravel",
  "Kinder",
  "Sonstige",
]);

export type BikeCategory = z.infer<typeof BikeCategory>;

export const BikeSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  category: BikeCategory,
  /** Main display price (offerPrice if available, otherwise listPrice) */
  price: z.number().positive(),
  /** UVP / Listenpreis */
  listPrice: z.number().positive().optional(),
  /** Actual offer/discount price if different from listPrice */
  offerPrice: z.number().positive().optional(),
  dealer: z.string().min(1),
  dealerUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  availability: z.string().optional(),
  /** Unique ID from the source system (SKU, offer ID, etc.) */
  sourceId: z.string().optional(),
  /** How the data was obtained */
  sourceType: z.enum(["api", "scrape", "manual"]).optional(),
  /** ISO timestamp when this listing was last confirmed available */
  lastSeenAt: z.string().datetime().optional(),
});

export type Bike = z.infer<typeof BikeSchema>;

export interface AdapterHealth {
  name: string;
  isHealthy: boolean;
  lastFetchAt: Date | null;
  lastError: string | null;
  listingCount: number;
  cacheTtlMs: number;
}

export interface DealerAdapter {
  readonly name: string;
  fetchBikes(): Promise<Bike[]>;
}
