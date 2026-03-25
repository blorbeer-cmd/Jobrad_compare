/* ============================================================
   TypeScript types mirroring the Python backend models
   (models.py / compare.py)
   ============================================================ */

export interface Shop {
  id: string;
  name: string;
  location: string;
}

export interface Offer {
  id: string;
  shopId: string;
  bikeModel: string;
  bikeBrand: string;
  price: number;
  monthlyRate: number;
  createdAt: string;      // ISO datetime
  validFrom: string;      // ISO date
  validUntil: string | null;
  isActive: boolean;
}

export interface ComparisonResult {
  bikeModel: string;
  bikeBrand: string;
  offers: Offer[];
  cheapestOffer: Offer | null;
}

export type SortField = 'monthlyRate' | 'price' | 'shopName';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
