/**
 * Awin feed adapter instances for each supported dealer.
 *
 * Each dealer's feedId is read from an environment variable so the operator
 * can configure their own Awin publisher approvals without touching code.
 *
 * Finding the feedId for a dealer:
 *   1. Log in to awin.com → My Publishers → Joined Programmes
 *   2. Click on the programme → "Product Feed" tab → note the advertiser ID in the URL
 *
 * German bike retailers confirmed as Awin advertisers (programme IDs are
 * account-specific — find yours via the step above):
 *   - Hibike          → AWIN_FEED_ID_HIBIKE
 *   - Bikester        → AWIN_FEED_ID_BIKESTER
 *   - Fahrrad XXL     → AWIN_FEED_ID_FAHRRAD_XXL
 *   - Brügelmann      → AWIN_FEED_ID_BRUEGELMANN
 *   - Lucky Bike      → AWIN_FEED_ID_LUCKY_BIKE
 *   - Bike Discount   → AWIN_FEED_ID_BIKE_DISCOUNT
 */

import { AwinFeedAdapter } from "./awin-feed-adapter";

function readFeedId(envVar: string): number {
  const val = process.env[envVar];
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

export class HibikeAwinAdapter extends AwinFeedAdapter {
  readonly name = "Hibike";
  get feedId() { return readFeedId("AWIN_FEED_ID_HIBIKE"); }
}

export class BikesterAwinAdapter extends AwinFeedAdapter {
  readonly name = "Bikester";
  get feedId() { return readFeedId("AWIN_FEED_ID_BIKESTER"); }
}

export class FahrradXXLAwinAdapter extends AwinFeedAdapter {
  readonly name = "Fahrrad XXL";
  get feedId() { return readFeedId("AWIN_FEED_ID_FAHRRAD_XXL"); }
}

export class BruegelmannAwinAdapter extends AwinFeedAdapter {
  readonly name = "Brügelmann";
  get feedId() { return readFeedId("AWIN_FEED_ID_BRUEGELMANN"); }
}

/** Lucky Bike: not scrapable (client-side rendering), Awin feed is the only option. */
export class LuckyBikeAwinAdapter extends AwinFeedAdapter {
  readonly name = "Lucky Bike";
  get feedId() { return readFeedId("AWIN_FEED_ID_LUCKY_BIKE"); }
}

/** Bike Discount: not scrapable (HTTP 403), Awin feed is the only option. */
export class BikeDiscountAwinAdapter extends AwinFeedAdapter {
  readonly name = "Bike-Discount";
  get feedId() { return readFeedId("AWIN_FEED_ID_BIKE_DISCOUNT"); }
}
