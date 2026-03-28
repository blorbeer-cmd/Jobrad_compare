/**
 * Offer comparison logic — TypeScript port of compare.py / models.py.
 *
 * Core functionality:
 * - Offer validity checks (active flag, date range)
 * - Per-shop deduplication (latest valid offer wins)
 * - Cheapest offer identification across shops
 */

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export interface Shop {
  id: string;
  name: string;
  location?: string;
}

export interface Offer {
  id: string;
  shopId: string;
  bikeModel: string;
  bikeBrand: string;
  price: number;
  monthlyRate: number;
  createdAt: Date;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
}

export interface ComparisonResult {
  bikeModel: string;
  bikeBrand: string;
  /** One offer per shop (the current/best one) */
  offers: Offer[];
  /** Offer with the lowest monthly rate, or null if no offers */
  cheapestOffer: Offer | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if an offer is valid on the given reference date. */
export function isOfferValid(offer: Offer, referenceDate: Date = new Date()): boolean {
  if (!offer.isActive) return false;
  if (offer.validFrom > referenceDate) return false;
  if (offer.validUntil !== null && offer.validUntil < referenceDate) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Return the most current valid offer for a given shop.
 *
 * Selection logic:
 * 1. Filter to offers for the given shop
 * 2. Filter to active offers valid on the reference date
 * 3. Among valid offers, pick the most recently created one
 */
export function getCurrentOfferForShop(
  offers: Offer[],
  shopId: string,
  referenceDate: Date = new Date()
): Offer | null {
  const shopOffers = offers.filter((o) => o.shopId === shopId);
  const validOffers = shopOffers.filter((o) => isOfferValid(o, referenceDate));

  if (validOffers.length === 0) return null;

  // Most recently created offer wins
  return validOffers.reduce((latest, current) =>
    current.createdAt > latest.createdAt ? current : latest
  );
}

/**
 * Get the current offer for each shop in the list.
 * Returns a map of shopId → current Offer (only shops with valid offers included).
 */
export function getCurrentOffersPerShop(
  offers: Offer[],
  shops: Shop[],
  referenceDate: Date = new Date()
): Map<string, Offer> {
  const result = new Map<string, Offer>();
  for (const shop of shops) {
    const current = getCurrentOfferForShop(offers, shop.id, referenceDate);
    if (current !== null) {
      result.set(shop.id, current);
    }
  }
  return result;
}

/**
 * Compare current offers across shops for a specific bike model.
 *
 * Only the latest valid offer per shop is included.
 * Old, expired, or inactive offers are excluded.
 */
export function compareOffers(
  offers: Offer[],
  shops: Shop[],
  bikeModel: string,
  bikeBrand: string,
  referenceDate: Date = new Date()
): ComparisonResult {
  const bikeOffers = offers.filter(
    (o) => o.bikeModel === bikeModel && o.bikeBrand === bikeBrand
  );

  const currentPerShop = getCurrentOffersPerShop(bikeOffers, shops, referenceDate);
  const currentOffers = [...currentPerShop.values()];

  const cheapestOffer =
    currentOffers.length > 0
      ? currentOffers.reduce((cheapest, current) =>
          current.monthlyRate < cheapest.monthlyRate ? current : cheapest
        )
      : null;

  return {
    bikeModel,
    bikeBrand,
    offers: currentOffers,
    cheapestOffer,
  };
}
