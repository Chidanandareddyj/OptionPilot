type MarketData = {
  ltp: number;
};

type OptionLeg = {
  instrument_key: string;
  market_data: MarketData;
};

type OptionChainStrike = {
  strike_price: number;
  underlying_spot_price: number;
  call_options: OptionLeg;
  put_options: OptionLeg;
};

type OptionChainResponse = {
  data: OptionChainStrike[];
};

export type LongStranglePayoff = {
  closing_price: number;
  call_pl: number;
  put_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateLongStrangle(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a long strangle from an empty option chain",
    );
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  const spotPrice = strikes[0].underlying_spot_price;

  /*
   * For a Long Strangle:
   * - Buy OTM Put  -> strike below spot
   * - Buy OTM Call -> strike above spot
   *
   * Find the first strike above spot and the last strike below spot.
   */

  const otmPutIndex = strikes.reduce(
    (closestIndex, current, currentIndex) => {
      if (
        current.strike_price < spotPrice &&
        Math.abs(current.strike_price - spotPrice) <
          Math.abs(strikes[closestIndex].strike_price - spotPrice)
      ) {
        return currentIndex;
      }

      return closestIndex;
    },
    0,
  );

  const otmCallIndex = strikes.reduce(
    (closestIndex, current, currentIndex) => {
      if (
        current.strike_price > spotPrice &&
        Math.abs(current.strike_price - spotPrice) <
          Math.abs(strikes[closestIndex].strike_price - spotPrice)
      ) {
        return currentIndex;
      }

      return closestIndex;
    },
    strikes.length - 1,
  );

  const putStrike = strikes[otmPutIndex];
  const callStrike = strikes[otmCallIndex];

  if (
    putStrike.strike_price >= spotPrice ||
    callStrike.strike_price <= spotPrice
  ) {
    throw new Error(
      "Could not find valid OTM Put and OTM Call strikes for Long Strangle",
    );
  }

  const putPremium = putStrike.put_options.market_data.ltp;
  const callPremium = callStrike.call_options.market_data.ltp;

  /*
   * Generate closing prices around the two selected strikes.
   */

  const lowerIndex = Math.max(
    0,
    otmPutIndex - recordsEachSide,
  );

  const upperIndex = Math.min(
    strikes.length,
    otmCallIndex + recordsEachSide + 1,
  );

  const nearbyStrikes = strikes.slice(lowerIndex, upperIndex);

  const payoffTable: LongStranglePayoff[] = nearbyStrikes.map(
    ({ strike_price: closingPrice }) => {

      // Long OTM Call P&L
      const callPl =
        Math.max(closingPrice - callStrike.strike_price, 0) -
        callPremium;

      // Long OTM Put P&L
      const putPl =
        Math.max(putStrike.strike_price - closingPrice, 0) -
        putPremium;

      return {
        closing_price: closingPrice,
        call_pl: round(callPl),
        put_pl: round(putPl),
        net_pl: round(callPl + putPl),
      };
    },
  );

  const totalPremium = callPremium + putPremium;

  return {
    spot_price: spotPrice,

    put_strike_price: putStrike.strike_price,
    call_strike_price: callStrike.strike_price,

    put_instrument_key: putStrike.put_options.instrument_key,
    call_instrument_key: callStrike.call_options.instrument_key,

    put_premium: putPremium,
    call_premium: callPremium,

    total_premium: round(totalPremium),

    lower_breakeven: round(
      putStrike.strike_price - totalPremium,
    ),

    upper_breakeven: round(
      callStrike.strike_price + totalPremium,
    ),

    payoff_table: payoffTable,
  };
}