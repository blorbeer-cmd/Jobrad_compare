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

export const DriveType = z.enum(["chain", "belt", "shaft"]);
export type DriveType = z.infer<typeof DriveType>;

export const SuspensionType = z.enum(["rigid", "front", "hardtail", "fully"]);
export type SuspensionType = z.infer<typeof SuspensionType>;

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

  // ── Technical specification fields ──────────────────────────────────────

  /** Frame size label as used by the manufacturer (e.g. "M", "L", "XL", "52 cm") */
  frameSize: z.string().optional(),
  /** Wheel diameter (e.g. "28\"", "29\"", "27.5\"", "26\"", "700c") */
  wheelSize: z.string().optional(),
  /** Drive train type */
  driveType: DriveType.optional(),
  /** Number of gears (total, e.g. 1×11 = 11, 2×10 = 20) */
  gearCount: z.number().int().positive().optional(),
  /** Battery capacity in Wh — E-Bikes only */
  batteryWh: z.number().positive().optional(),
  /** Motor brand/model — E-Bikes only (e.g. "Bosch Performance Line CX") */
  motor: z.string().optional(),
  /** Suspension type */
  suspension: SuspensionType.optional(),
  /** Frame material (e.g. "Aluminium", "Carbon", "Stahl") */
  frameMaterial: z.string().optional(),
  /** Colour as listed by the dealer */
  color: z.string().optional(),
  /** Model year (e.g. 2024) */
  modelYear: z.number().int().optional(),
});

export type Bike = z.infer<typeof BikeSchema>;

export interface AdapterHealth {
  name: string;
  isHealthy: boolean;
  lastFetchAt: Date | null;
  lastError: string | null;
  /** Warning message set when fetch succeeded but returned 0 bikes (stale selectors?) */
  lastWarning: string | null;
  listingCount: number;
  cacheTtlMs: number;
}

export interface DealerAdapter {
  readonly name: string;
  fetchBikes(): Promise<Bike[]>;
}
