import {
  calculateBearCallSpread,
  calculateBearPutSpread,
  calculateBullCallSpread,
  calculateBullPutSpread,
  calculateCallButterfly,
  calculateCallCondor,
  calculateLongStraddle,
  calculateLongStrangle,
  calculatePutButterfly,
  calculatePutCondor,
  calculateShortStraddle,
  calculateShortStrangle,
} from "@optionpilot/shared";

export const SPOT = 1190;
export const LOT_SIZE = 500;

/** Premiums that match the design sample: 1180 CE 14.20, 1200 CE 5.60, 1200 PE 18.40, 1180 PE 7.25. */
const PINNED: Record<string, number> = { "1180-call": 14.2, "1200-call": 5.6, "1200-put": 18.4, "1180-put": 7.25 };

function premium(strike: number, type: "call" | "put"): number {
  const pinned = PINNED[`${strike}-${type}`];
  if (pinned !== undefined) return pinned;
  if (strike === SPOT) return 9.6;
  // Out of the money: the pinned premium decays away from the spot. In the money: intrinsic value
  // plus a small time value that decays the same way. This keeps premiums monotone in the strike.
  const outside = type === "call" ? strike > SPOT : strike < SPOT;
  const edge = type === "call" ? 1200 : 1180;
  const value = outside
    ? PINNED[`${edge}-${type}`] * Math.exp(-Math.abs(strike - edge) / 18)
    : Math.abs(strike - SPOT) + (type === "call" ? 4.2 : 8.4) * Math.exp(-Math.abs(strike - (type === "call" ? 1180 : 1200)) / 30);
  return Math.round(value * 100) / 100;
}

/** An option chain for RELIANCE around 1,190, in the shape the Upstox client returns. */
export function optionChain() {
  const data = [];
  for (let strike = 1090; strike <= 1290; strike += 10) {
    data.push({
      strike_price: strike,
      underlying_spot_price: SPOT,
      call_options: { instrument_key: `NSE_FO|${strike}CE`, market_data: { ltp: premium(strike, "call") } },
      put_options: { instrument_key: `NSE_FO|${strike}PE`, market_data: { ltp: premium(strike, "put") } },
    });
  }
  return { data };
}

/** What `POST /api/analyze` and `GET /api/analyses/:id` carry as `result`, built by the real calculators. */
export function analysisResult(): Record<string, unknown> {
  const chain = optionChain();
  return {
    underlying_key: "NSE_EQ|INE002A01018",
    company_name: "Reliance Industries Ltd",
    expiry_date: "2026-10-27",
    lot_size: LOT_SIZE,
    underlying_spot_price: SPOT,
    atm_strike: SPOT,
    long_straddle: calculateLongStraddle(chain, 10),
    bull_call_spread: calculateBullCallSpread(chain, 10),
    bull_put_spread: calculateBullPutSpread(chain, 10),
    call_butterfly: calculateCallButterfly(chain, 10),
    put_butterfly: calculatePutButterfly(chain, 10),
    call_condor: calculateCallCondor(chain, 10),
    put_condor: calculatePutCondor(chain, 10),
    bear_call_spread: calculateBearCallSpread(chain, 10),
    bear_put_spread: calculateBearPutSpread(chain, 10),
    long_strangle: calculateLongStrangle(chain, 10),
    short_straddle: calculateShortStraddle(chain, 10),
    short_strangle: calculateShortStrangle(chain, 10),
  };
}
