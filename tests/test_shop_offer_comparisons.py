"""Tests to ensure that comparisons always use the current/latest offer per shop.

These tests verify that:
- Only active, currently valid offers are used
- When a shop has multiple offers, the most recently created one wins
- Expired offers are excluded
- Future offers (not yet valid) are excluded
- Deactivated offers are excluded
- Each shop contributes at most one offer to a comparison
- The cheapest offer is correctly identified
"""

import sys
import os
from datetime import date, datetime, timedelta

import pytest

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import Offer, Shop
from compare import (
    compare_offers,
    get_current_offer_for_shop,
    get_current_offers_per_shop,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

REFERENCE_DATE = date(2026, 3, 24)


@pytest.fixture
def shops():
    return [
        Shop(id="shop_a", name="Bike Store A", location="Berlin"),
        Shop(id="shop_b", name="Bike Store B", location="München"),
        Shop(id="shop_c", name="Bike Store C", location="Hamburg"),
    ]


def _make_offer(
    id: str,
    shop_id: str,
    price: float,
    monthly_rate: float,
    created_at: datetime | None = None,
    valid_from: date | None = None,
    valid_until: date | None = None,
    is_active: bool = True,
    bike_model: str = "Trekking 500",
    bike_brand: str = "Cube",
) -> Offer:
    return Offer(
        id=id,
        shop_id=shop_id,
        bike_model=bike_model,
        bike_brand=bike_brand,
        price=price,
        monthly_rate=monthly_rate,
        created_at=created_at or datetime(2026, 3, 1, 10, 0, 0),
        valid_from=valid_from or date(2026, 1, 1),
        valid_until=valid_until,
        is_active=is_active,
    )


# ---------------------------------------------------------------------------
# Tests: get_current_offer_for_shop
# ---------------------------------------------------------------------------


class TestGetCurrentOfferForShop:
    """Tests for selecting the current offer from a single shop."""

    def test_returns_only_valid_offer(self):
        """A single valid offer should be returned."""
        offers = [
            _make_offer("o1", "shop_a", 3000, 80),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "o1"

    def test_returns_none_when_no_offers(self):
        """No offers for a shop should return None."""
        result = get_current_offer_for_shop([], "shop_a", REFERENCE_DATE)
        assert result is None

    def test_returns_none_for_wrong_shop(self):
        """Offers from other shops should not match."""
        offers = [
            _make_offer("o1", "shop_b", 3000, 80),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is None

    def test_latest_created_offer_wins(self):
        """When multiple valid offers exist, the most recently created one wins."""
        offers = [
            _make_offer("old", "shop_a", 3000, 90,
                        created_at=datetime(2026, 2, 1, 10, 0, 0)),
            _make_offer("new", "shop_a", 3100, 85,
                        created_at=datetime(2026, 3, 15, 10, 0, 0)),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "new"

    def test_expired_offer_excluded(self):
        """An offer past its valid_until date should not be returned."""
        offers = [
            _make_offer("expired", "shop_a", 3000, 80,
                        valid_until=date(2026, 3, 1)),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is None

    def test_future_offer_excluded(self):
        """An offer not yet valid (valid_from in the future) should not be returned."""
        offers = [
            _make_offer("future", "shop_a", 3000, 80,
                        valid_from=date(2026, 4, 1)),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is None

    def test_inactive_offer_excluded(self):
        """A deactivated offer should not be returned."""
        offers = [
            _make_offer("inactive", "shop_a", 3000, 80, is_active=False),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is None

    def test_expired_offer_skipped_for_older_valid(self):
        """If the newest offer is expired, fall back to the next-newest valid offer."""
        offers = [
            _make_offer("older_valid", "shop_a", 3000, 90,
                        created_at=datetime(2026, 2, 1)),
            _make_offer("newer_expired", "shop_a", 2800, 75,
                        created_at=datetime(2026, 3, 10),
                        valid_until=date(2026, 3, 20)),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "older_valid"

    def test_inactive_offer_skipped_for_older_valid(self):
        """If the newest offer is inactive, fall back to the next-newest valid offer."""
        offers = [
            _make_offer("older_valid", "shop_a", 3000, 90,
                        created_at=datetime(2026, 2, 1)),
            _make_offer("newer_inactive", "shop_a", 2800, 75,
                        created_at=datetime(2026, 3, 10),
                        is_active=False),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "older_valid"

    def test_offer_valid_on_exact_boundary_dates(self):
        """An offer should be valid on its valid_from and valid_until dates."""
        offers = [
            _make_offer("boundary", "shop_a", 3000, 80,
                        valid_from=REFERENCE_DATE,
                        valid_until=REFERENCE_DATE),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "boundary"

    def test_offer_without_valid_until_stays_valid(self):
        """An offer without valid_until (open-ended) stays valid indefinitely."""
        offers = [
            _make_offer("open", "shop_a", 3000, 80, valid_until=None),
        ]
        result = get_current_offer_for_shop(offers, "shop_a", REFERENCE_DATE)
        assert result is not None
        assert result.id == "open"


# ---------------------------------------------------------------------------
# Tests: get_current_offers_per_shop
# ---------------------------------------------------------------------------


class TestGetCurrentOffersPerShop:
    """Tests for selecting one current offer per shop."""

    def test_one_offer_per_shop(self, shops):
        """Each shop should have at most one offer in the result."""
        offers = [
            _make_offer("a1", "shop_a", 3000, 80,
                        created_at=datetime(2026, 2, 1)),
            _make_offer("a2", "shop_a", 3100, 85,
                        created_at=datetime(2026, 3, 1)),
            _make_offer("b1", "shop_b", 2900, 78,
                        created_at=datetime(2026, 3, 1)),
        ]
        result = get_current_offers_per_shop(offers, shops, REFERENCE_DATE)

        assert "shop_a" in result
        assert "shop_b" in result
        assert "shop_c" not in result  # no offers for shop_c
        assert result["shop_a"].id == "a2"  # newer offer
        assert result["shop_b"].id == "b1"

    def test_shops_without_valid_offers_excluded(self, shops):
        """Shops with only expired/inactive offers should not appear."""
        offers = [
            _make_offer("expired", "shop_a", 3000, 80,
                        valid_until=date(2026, 2, 1)),
            _make_offer("inactive", "shop_b", 2900, 78, is_active=False),
            _make_offer("valid", "shop_c", 3200, 90),
        ]
        result = get_current_offers_per_shop(offers, shops, REFERENCE_DATE)

        assert "shop_a" not in result
        assert "shop_b" not in result
        assert "shop_c" in result

    def test_each_shop_gets_its_own_latest(self, shops):
        """Each shop independently selects its own latest offer."""
        offers = [
            # Shop A: two offers, newer one should win
            _make_offer("a_old", "shop_a", 3000, 90,
                        created_at=datetime(2026, 1, 15)),
            _make_offer("a_new", "shop_a", 3100, 82,
                        created_at=datetime(2026, 3, 20)),
            # Shop B: two offers, newer one should win
            _make_offer("b_old", "shop_b", 2800, 75,
                        created_at=datetime(2026, 1, 10)),
            _make_offer("b_new", "shop_b", 2900, 77,
                        created_at=datetime(2026, 3, 18)),
        ]
        result = get_current_offers_per_shop(offers, shops, REFERENCE_DATE)

        assert result["shop_a"].id == "a_new"
        assert result["shop_b"].id == "b_new"


# ---------------------------------------------------------------------------
# Tests: compare_offers (full comparison)
# ---------------------------------------------------------------------------


class TestCompareOffers:
    """Tests for the full comparison pipeline."""

    def test_comparison_uses_current_offers_only(self, shops):
        """Comparison should only include the current offer from each shop."""
        offers = [
            # Shop A: old cheap offer (expired) + new expensive offer
            _make_offer("a_old_cheap", "shop_a", 2500, 65,
                        created_at=datetime(2026, 1, 1),
                        valid_until=date(2026, 2, 28)),
            _make_offer("a_new", "shop_a", 3000, 80,
                        created_at=datetime(2026, 3, 1)),
            # Shop B: single valid offer
            _make_offer("b1", "shop_b", 2900, 78,
                        created_at=datetime(2026, 3, 1)),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        offer_ids = {o.id for o in result.offers}
        # The expired cheap offer must NOT be included
        assert "a_old_cheap" not in offer_ids
        assert "a_new" in offer_ids
        assert "b1" in offer_ids
        assert len(result.offers) == 2

    def test_cheapest_offer_identified(self, shops):
        """The cheapest monthly rate among current offers should be identified."""
        offers = [
            _make_offer("a1", "shop_a", 3000, 85,
                        created_at=datetime(2026, 3, 1)),
            _make_offer("b1", "shop_b", 2800, 72,
                        created_at=datetime(2026, 3, 1)),
            _make_offer("c1", "shop_c", 3200, 90,
                        created_at=datetime(2026, 3, 1)),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        assert result.cheapest_offer is not None
        assert result.cheapest_offer.id == "b1"
        assert result.cheapest_offer.monthly_rate == 72

    def test_comparison_filters_by_bike(self, shops):
        """Only offers for the requested bike model/brand should be compared."""
        offers = [
            _make_offer("a_cube", "shop_a", 3000, 80,
                        bike_model="Trekking 500", bike_brand="Cube"),
            _make_offer("a_giant", "shop_a", 2800, 75,
                        bike_model="Escape 3", bike_brand="Giant"),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        assert len(result.offers) == 1
        assert result.offers[0].id == "a_cube"

    def test_comparison_empty_when_all_expired(self, shops):
        """If all offers are expired, the comparison result should be empty."""
        offers = [
            _make_offer("a_exp", "shop_a", 3000, 80,
                        valid_until=date(2026, 2, 1)),
            _make_offer("b_exp", "shop_b", 2900, 78,
                        valid_until=date(2026, 3, 1)),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        assert len(result.offers) == 0
        assert result.cheapest_offer is None

    def test_old_offer_not_used_when_newer_exists(self, shops):
        """Ensure an older (cheaper) offer is NOT used when a newer one replaces it."""
        offers = [
            # Shop A had a very cheap offer in January, now replaced by a pricier one
            _make_offer("a_jan", "shop_a", 2500, 60,
                        created_at=datetime(2026, 1, 5)),
            _make_offer("a_mar", "shop_a", 3000, 85,
                        created_at=datetime(2026, 3, 5)),
            # Shop B
            _make_offer("b1", "shop_b", 2900, 78,
                        created_at=datetime(2026, 3, 1)),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        offer_ids = {o.id for o in result.offers}
        # The old cheap January offer must NOT be used
        assert "a_jan" not in offer_ids
        # The current March offer should be used
        assert "a_mar" in offer_ids
        # Shop B's cheapest offer wins overall
        assert result.cheapest_offer.id == "b1"

    def test_updated_price_reflected_in_comparison(self, shops):
        """When a shop updates its price (new offer), the comparison reflects the new price."""
        offers = [
            # Shop A lowered its price recently
            _make_offer("a_old", "shop_a", 3200, 95,
                        created_at=datetime(2026, 2, 1)),
            _make_offer("a_new", "shop_a", 2800, 72,
                        created_at=datetime(2026, 3, 20)),
            # Shop B unchanged
            _make_offer("b1", "shop_b", 3000, 80,
                        created_at=datetime(2026, 3, 1)),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        # Shop A's current offer should be the new lower price
        shop_a_offer = next(o for o in result.offers if o.shop_id == "shop_a")
        assert shop_a_offer.monthly_rate == 72
        assert shop_a_offer.id == "a_new"
        # And it should be the cheapest
        assert result.cheapest_offer.id == "a_new"

    def test_comparison_result_metadata(self, shops):
        """ComparisonResult should carry the correct bike model/brand."""
        offers = [
            _make_offer("a1", "shop_a", 3000, 80),
        ]
        result = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )

        assert result.bike_model == "Trekking 500"
        assert result.bike_brand == "Cube"

    def test_multiple_bikes_independent_comparisons(self, shops):
        """Comparing different bikes should yield independent results."""
        offers = [
            _make_offer("a_cube", "shop_a", 3000, 80,
                        bike_model="Trekking 500", bike_brand="Cube",
                        created_at=datetime(2026, 3, 1)),
            _make_offer("a_giant", "shop_a", 2500, 65,
                        bike_model="Escape 3", bike_brand="Giant",
                        created_at=datetime(2026, 3, 1)),
        ]

        result_cube = compare_offers(
            offers, shops, "Trekking 500", "Cube", REFERENCE_DATE
        )
        result_giant = compare_offers(
            offers, shops, "Escape 3", "Giant", REFERENCE_DATE
        )

        assert len(result_cube.offers) == 1
        assert result_cube.offers[0].monthly_rate == 80
        assert len(result_giant.offers) == 1
        assert result_giant.offers[0].monthly_rate == 65


# ---------------------------------------------------------------------------
# Tests: Model validation
# ---------------------------------------------------------------------------


class TestOfferModel:
    """Tests for the Offer model's validity checks."""

    def test_is_currently_valid_active_offer(self):
        offer = _make_offer("o1", "shop_a", 3000, 80)
        # Override today-dependent check with explicit dates
        offer.valid_from = date(2020, 1, 1)
        offer.valid_until = date(2030, 12, 31)
        assert offer.is_currently_valid is True

    def test_is_currently_valid_expired(self):
        offer = _make_offer("o1", "shop_a", 3000, 80,
                            valid_until=date(2020, 1, 1))
        assert offer.is_currently_valid is False

    def test_is_currently_valid_future(self):
        offer = _make_offer("o1", "shop_a", 3000, 80,
                            valid_from=date(2030, 1, 1))
        assert offer.is_currently_valid is False

    def test_is_currently_valid_inactive(self):
        offer = _make_offer("o1", "shop_a", 3000, 80, is_active=False)
        assert offer.is_currently_valid is False
