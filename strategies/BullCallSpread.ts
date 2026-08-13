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

export type BullCallSpreadPayoff = {
  closing_price: number;
  long_call_pl: number;
  short_call_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateBullCallSpread(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a bull call spread from an empty option chain",
    );
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  const spotPrice = strikes[0].underlying_spot_price;

  const atmIndex = strikes.reduce(
    (closestIndex, current, currentIndex, allStrikes) =>
      Math.abs(current.strike_price - spotPrice) <
      Math.abs(allStrikes[closestIndex].strike_price - spotPrice)
        ? currentIndex
        : closestIndex,
    0,
  );

  if (atmIndex >= strikes.length - 1) {
    throw new Error(
      "Not enough option strikes to construct a bull call spread",
    );
  }

  const lowerStrike = strikes[atmIndex];
  const higherStrike = strikes[atmIndex + 1];

  const lowerCallPremium =
    lowerStrike.call_options.market_data.ltp;

  const higherCallPremium =
    higherStrike.call_options.market_data.ltp;

  const netDebit = round(
    lowerCallPremium - higherCallPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Bull call spread does not produce a valid net debit",
    );
  }

  const strikeDifference =
    higherStrike.strike_price - lowerStrike.strike_price;

  const maxProfit = round(
    strikeDifference - netDebit,
  );

  const maxLoss = netDebit;

  const breakeven = round(
    lowerStrike.strike_price + netDebit,
  );

  const startIndex = Math.max(
    0,
    atmIndex - recordsEachSide,
  );

  const endIndex = Math.min(
    strikes.length,
    atmIndex + recordsEachSide + 2,
  );

  const nearbyStrikes = strikes.slice(
    startIndex,
    endIndex,
  );

  const payoffTable: BullCallSpreadPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const longCallPl =
          Math.max(
            closingPrice - lowerStrike.strike_price,
            0,
          ) - lowerCallPremium;

        const shortCallPl =
          higherCallPremium -
          Math.max(
            closingPrice - higherStrike.strike_price,
            0,
          );

        const netPl =
          longCallPl + shortCallPl;

        return {
          closing_price: closingPrice,
          long_call_pl: round(longCallPl),
          short_call_pl: round(shortCallPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    lower_strike: lowerStrike.strike_price,
    higher_strike: higherStrike.strike_price,

    lower_call_instrument_key:
      lowerStrike.call_options.instrument_key,

    higher_call_instrument_key:
      higherStrike.call_options.instrument_key,

    lower_call_premium: lowerCallPremium,
    higher_call_premium: higherCallPremium,

    net_debit: netDebit,

    max_profit: maxProfit,
    max_loss: maxLoss,

    breakeven,

    payoff_table: payoffTable,
  };
}