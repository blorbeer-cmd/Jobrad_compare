"""Models for Jobrad shop offer comparisons."""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional


@dataclass
class Shop:
    """A bike shop that provides JobRad offers."""

    id: str
    name: str
    location: str = ""


@dataclass
class Offer:
    """A single offer from a shop for a specific bike configuration."""

    id: str
    shop_id: str
    bike_model: str
    bike_brand: str
    price: float
    monthly_rate: float
    created_at: datetime = field(default_factory=datetime.now)
    valid_from: date = field(default_factory=date.today)
    valid_until: Optional[date] = None
    is_active: bool = True

    @property
    def is_currently_valid(self) -> bool:
        """Check if this offer is currently valid based on dates and active flag."""
        today = date.today()
        if not self.is_active:
            return False
        if self.valid_until and self.valid_until < today:
            return False
        if self.valid_from > today:
            return False
        return True
