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
  price: z.number().positive(),
  dealer: z.string().min(1),
  dealerUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  availability: z.string().optional(),
});

export type Bike = z.infer<typeof BikeSchema>;

export interface DealerAdapter {
  name: string;
  fetchBikes(): Promise<Bike[]>;
}
