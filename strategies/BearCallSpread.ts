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

export type BearCallSpreadPayoff = {
  closing_price: number;
  short_call_pl: number;
  long_call_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculateBearCallSpread(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain?.data?.length) {
    throw new Error(
      "Cannot calculate a bear call spread from an empty option chain",
    );
  }

  if (recordsEachSide < 0) {
    throw new Error(
      "recordsEachSide must be greater than or equal to 0",
    );
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  // Use the first strike's underlying spot price.
  const spotPrice = strikes[0].underlying_spot_price;

  // Find the strike closest to the current spot price.
  const atmIndex = strikes.reduce(
    (closestIndex, current, currentIndex, allStrikes) =>
      Math.abs(current.strike_price - spotPrice) <
      Math.abs(
        allStrikes[closestIndex].strike_price - spotPrice,
      )
        ? currentIndex
        : closestIndex,
    0,
  );

  // We need one strike below ATM and one above ATM.
  if (
    atmIndex === 0 ||
    atmIndex >= strikes.length - 1
  ) {
    throw new Error(
      "Not enough option strikes to construct a bear call spread",
    );
  }

  /*
   * Bear Call Spread:
   *
   * SELL lower-strike call
   * BUY  higher-strike call
   *
   * This produces a NET CREDIT.
   */
  const lowerStrike = strikes[atmIndex - 1];
  const higherStrike = strikes[atmIndex + 1];

  const shortCallPremium =
    lowerStrike.call_options.market_data.ltp;

  const longCallPremium =
    higherStrike.call_options.market_data.ltp;
  const netCredit = round(
    shortCallPremium - longCallPremium,
  );

  if (netCredit <= 0) {
    throw new Error(
      "Bear call spread does not produce a valid net credit",
    );
  }

  const strikeDifference =
    higherStrike.strike_price -
    lowerStrike.strike_price;

  const maxProfit = netCredit;

  const maxLoss = round(
    strikeDifference - netCredit,
  );

  const breakeven = round(
    lowerStrike.strike_price + netCredit,
  );


  const nearbyStrikes = strikes.slice(
    Math.max(
      0,
      atmIndex - recordsEachSide,
    ),
    atmIndex + recordsEachSide + 1,
  );

  const payoffTable: BearCallSpreadPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const shortCallPl =
          shortCallPremium -
          Math.max(
            closingPrice -
              lowerStrike.strike_price,
            0,
          );

        const longCallPl =
          Math.max(
            closingPrice -
              higherStrike.strike_price,
            0,
          ) - longCallPremium;

        const netPl =
          shortCallPl + longCallPl;

        return {
          closing_price: closingPrice,
          short_call_pl: round(shortCallPl),
          long_call_pl: round(longCallPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,


    short_call_strike: lowerStrike.strike_price,

    long_call_strike: higherStrike.strike_price,

    short_call_instrument_key:
      lowerStrike.call_options.instrument_key,

    long_call_instrument_key:
      higherStrike.call_options.instrument_key,

    short_call_premium: shortCallPremium,
    long_call_premium: longCallPremium,

    net_credit: netCredit,

    max_profit: maxProfit,
    max_loss: maxLoss,

    breakeven,

    payoff_table: payoffTable,
  };
}