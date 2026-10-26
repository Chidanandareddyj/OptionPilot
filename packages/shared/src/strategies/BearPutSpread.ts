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

export type BearPutSpreadPayoff = {
  closing_price: number;
  long_put_pl: number;
  short_put_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculateBearPutSpread(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain?.data?.length) {
    throw new Error(
      "Cannot calculate a bear put spread from an empty option chain",
    );
  }

  if (recordsEachSide < 0) {
    throw new Error(
      "recordsEachSide must be greater than or equal to 0",
    );
  }

  // Sort strikes from lowest to highest.
  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  // Current underlying price.
  const spotPrice =
    strikes[0].underlying_spot_price;

  // Find the strike closest to the current spot.
  const atmIndex = strikes.reduce(
    (closestIndex, current, currentIndex, allStrikes) =>
      Math.abs(
        current.strike_price - spotPrice,
      ) <
      Math.abs(
        allStrikes[closestIndex].strike_price -
          spotPrice,
      )
        ? currentIndex
        : closestIndex,
    0,
  );

  // Need one strike below ATM and one strike above ATM.
  if (
    atmIndex === 0 ||
    atmIndex >= strikes.length - 1
  ) {
    throw new Error(
      "Not enough option strikes to construct a bear put spread",
    );
  }

  /*
   * Bear Put Spread:
   *
   * BUY  higher-strike PUT
   * SELL lower-strike PUT
   *
   * This produces a NET DEBIT.
   */

  const lowerStrike = strikes[atmIndex - 1];
  const higherStrike = strikes[atmIndex + 1];

  // Buy the higher-strike put.
  const longPutPremium =
    higherStrike.put_options.market_data.ltp;

  // Sell the lower-strike put.
  const shortPutPremium =
    lowerStrike.put_options.market_data.ltp;

  // Premium paid - premium received.
  const netDebit = round(
    longPutPremium - shortPutPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Bear put spread does not produce a valid net debit",
    );
  }

  const strikeDifference =
    higherStrike.strike_price -
    lowerStrike.strike_price;

  // Maximum profit occurs when expiry price
  // is at or below the lower strike.
  const maxProfit = round(
    strikeDifference - netDebit,
  );

  // Maximum loss occurs when expiry price
  // is at or above the higher strike.
  const maxLoss = netDebit;

  // Breakeven = higher strike - net debit.
  const breakeven = round(
    higherStrike.strike_price - netDebit,
  );

  /*
   * Generate nearby expiry prices
   * for the payoff table.
   */

  const nearbyStrikes = strikes.slice(
    Math.max(
      0,
      atmIndex - recordsEachSide,
    ),
    atmIndex + recordsEachSide + 1,
  );

  const payoffTable: BearPutSpreadPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        /*
         * Long higher-strike PUT:
         *
         * Intrinsic value
         * - premium paid
         */
        const longPutPl =
          Math.max(
            higherStrike.strike_price -
              closingPrice,
            0,
          ) - longPutPremium;

        /*
         * Short lower-strike PUT:
         *
         * Premium received
         * - intrinsic value
         */
        const shortPutPl =
          shortPutPremium -
          Math.max(
            lowerStrike.strike_price -
              closingPrice,
            0,
          );

        const netPl =
          longPutPl + shortPutPl;

        return {
          closing_price: closingPrice,
          long_put_pl: round(longPutPl),
          short_put_pl: round(shortPutPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    // Long put = higher strike
    long_put_strike:
      higherStrike.strike_price,

    // Short put = lower strike
    short_put_strike:
      lowerStrike.strike_price,

    long_put_instrument_key:
      higherStrike.put_options.instrument_key,

    short_put_instrument_key:
      lowerStrike.put_options.instrument_key,

    long_put_premium: longPutPremium,
    short_put_premium: shortPutPremium,

    net_debit: netDebit,

    max_profit: maxProfit,
    max_loss: maxLoss,

    breakeven,

    payoff_table: payoffTable,
  };
}