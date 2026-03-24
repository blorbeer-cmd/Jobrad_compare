"""Comparison logic for Jobrad shop offers.

Ensures that only the latest/current offer per shop is used for comparisons.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional

from models import Offer, Shop


@dataclass
class ComparisonResult:
    """Result of comparing offers from multiple shops for the same bike."""

    bike_model: str
    bike_brand: str
    offers: list[Offer]
    cheapest_offer: Optional[Offer] = None

    def __post_init__(self):
        if self.offers:
            self.cheapest_offer = min(self.offers, key=lambda o: o.monthly_rate)


def get_current_offer_for_shop(
    offers: list[Offer], shop_id: str, reference_date: Optional[date] = None
) -> Optional[Offer]:
    """Return the most current/latest valid offer for a given shop.

    Selection logic:
    1. Filter to offers for the given shop
    2. Filter to active offers that are valid on the reference date
    3. Among valid offers, pick the one most recently created (latest created_at)

    Args:
        offers: All available offers.
        shop_id: The shop to find the current offer for.
        reference_date: Date to check validity against (defaults to today).

    Returns:
        The current offer for the shop, or None if no valid offer exists.
    """
    ref = reference_date or date.today()

    shop_offers = [o for o in offers if o.shop_id == shop_id]

    valid_offers = []
    for offer in shop_offers:
        if not offer.is_active:
            continue
        if offer.valid_from > ref:
            continue
        if offer.valid_until and offer.valid_until < ref:
            continue
        valid_offers.append(offer)

    if not valid_offers:
        return None

    # Most recently created offer wins
    return max(valid_offers, key=lambda o: o.created_at)


def get_current_offers_per_shop(
    offers: list[Offer],
    shops: list[Shop],
    reference_date: Optional[date] = None,
) -> dict[str, Offer]:
    """Get the current offer for each shop.

    Returns a dict mapping shop_id -> current Offer (only shops with valid offers).
    """
    result = {}
    for shop in shops:
        current = get_current_offer_for_shop(offers, shop.id, reference_date)
        if current is not None:
            result[shop.id] = current
    return result


def compare_offers(
    offers: list[Offer],
    shops: list[Shop],
    bike_model: str,
    bike_brand: str,
    reference_date: Optional[date] = None,
) -> ComparisonResult:
    """Compare current offers across shops for a specific bike.

    Only the latest valid offer per shop is included in the comparison.

    Args:
        offers: All available offers (may include old/expired ones).
        shops: List of shops to compare.
        bike_model: The bike model to compare.
        bike_brand: The bike brand to compare.
        reference_date: Date to check validity against.

    Returns:
        ComparisonResult with one offer per shop (the current one).
    """
    # Filter to the specific bike first
    bike_offers = [
        o for o in offers if o.bike_model == bike_model and o.bike_brand == bike_brand
    ]

    current_per_shop = get_current_offers_per_shop(bike_offers, shops, reference_date)

    return ComparisonResult(
        bike_model=bike_model,
        bike_brand=bike_brand,
        offers=list(current_per_shop.values()),
    )
