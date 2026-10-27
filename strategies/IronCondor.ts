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

export type IronCondorPayoff = {
  closing_price: number;
  long_put_pl: number;
  short_put_pl: number;
  short_call_pl: number;
  long_call_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateIronCondor(
  chain: OptionChainResponse,
  wingWidth = 2,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error("Cannot calculate an iron condor from an empty option chain");
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  const spotPrice = strikes[0].underlying_spot_price;

  // Find the ATM strike
  const atmIndex = strikes.reduce(
    (closestIndex, current, currentIndex, allStrikes) =>
      Math.abs(current.strike_price - spotPrice) <
      Math.abs(allStrikes[closestIndex].strike_price - spotPrice)
        ? currentIndex
        : closestIndex,
    0,
  );

  // We need two strikes below ATM and two strikes above ATM.
  if (
    atmIndex - wingWidth < 0 ||
    atmIndex + wingWidth >= strikes.length
  ) {
    throw new Error("Not enough option strikes to construct an iron condor");
  }

  const lowerLongPut = strikes[atmIndex - wingWidth];
  const shortPut = strikes[atmIndex - 1];
  const shortCall = strikes[atmIndex + 1];
  const upperLongCall = strikes[atmIndex + wingWidth];

  const longPutPremium = lowerLongPut.put_options.market_data.ltp;
  const shortPutPremium = shortPut.put_options.market_data.ltp;
  const shortCallPremium = shortCall.call_options.market_data.ltp;
  const longCallPremium = upperLongCall.call_options.market_data.ltp;

  const netPremium = round(
    shortPutPremium +
      shortCallPremium -
      longPutPremium -
      longCallPremium,
  );

  if (netPremium <= 0) {
    throw new Error(
      "Iron condor does not produce a net credit with the selected strikes",
    );
  }

  const lowerBreakeven = round(shortPut.strike_price - netPremium);
  const upperBreakeven = round(shortCall.strike_price + netPremium);

  const putSpreadWidth =
    shortPut.strike_price - lowerLongPut.strike_price;

  const callSpreadWidth =
    upperLongCall.strike_price - shortCall.strike_price;

  const maxProfit = netPremium;

  const maxLoss = round(
    Math.max(putSpreadWidth, callSpreadWidth) - netPremium,
  );

  const startIndex = Math.max(0, atmIndex - recordsEachSide);
  const endIndex = Math.min(
    strikes.length,
    atmIndex + recordsEachSide + 1,
  );

  const nearbyStrikes = strikes.slice(startIndex, endIndex);

  const payoffTable: IronCondorPayoff[] = nearbyStrikes.map(
    ({ strike_price: closingPrice }) => {
      const longPutPl =
        -longPutPremium +
        Math.max(lowerLongPut.strike_price - closingPrice, 0);

      const shortPutPl =
        shortPutPremium -
        Math.max(shortPut.strike_price - closingPrice, 0);

      const shortCallPl =
        shortCallPremium -
        Math.max(closingPrice - shortCall.strike_price, 0);

      const longCallPl =
        -longCallPremium +
        Math.max(closingPrice - upperLongCall.strike_price, 0);

      const netPl =
        longPutPl +
        shortPutPl +
        shortCallPl +
        longCallPl;

      return {
        closing_price: closingPrice,
        long_put_pl: round(longPutPl),
        short_put_pl: round(shortPutPl),
        short_call_pl: round(shortCallPl),
        long_call_pl: round(longCallPl),
        net_pl: round(netPl),
      };
    },
  );

  return {
    spot_price: spotPrice,

    long_put_strike: lowerLongPut.strike_price,
    short_put_strike: shortPut.strike_price,
    short_call_strike: shortCall.strike_price,
    long_call_strike: upperLongCall.strike_price,

    long_put_instrument_key: lowerLongPut.put_options.instrument_key,
    short_put_instrument_key: shortPut.put_options.instrument_key,
    short_call_instrument_key: shortCall.call_options.instrument_key,
    long_call_instrument_key: upperLongCall.call_options.instrument_key,

    long_put_premium: longPutPremium,
    short_put_premium: shortPutPremium,
    short_call_premium: shortCallPremium,
    long_call_premium: longCallPremium,

    net_premium: netPremium,

    max_profit: round(maxProfit),
    max_loss: maxLoss,

    lower_breakeven: lowerBreakeven,
    upper_breakeven: upperBreakeven,

    payoff_table: payoffTable,
  };
}