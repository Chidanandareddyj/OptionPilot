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

export type ButterflySpreadPayoff = {
  closing_price: number;
  lower_call_pl: number;
  middle_calls_pl: number;
  upper_call_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateButterflySpread(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a butterfly spread from an empty option chain",
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

  if (atmIndex === 0 || atmIndex === strikes.length - 1) {
    throw new Error(
      "Not enough option strikes to construct a butterfly spread",
    );
  }

  const lowerStrike = strikes[atmIndex - 1];
  const middleStrike = strikes[atmIndex];
  const upperStrike = strikes[atmIndex + 1];

  const strikeWidthLower =
    middleStrike.strike_price - lowerStrike.strike_price;

  const strikeWidthUpper =
    upperStrike.strike_price - middleStrike.strike_price;

  if (strikeWidthLower !== strikeWidthUpper) {
    throw new Error(
      "Selected strikes are not equally spaced for a balanced butterfly",
    );
  }

  const lowerCallPremium =
    lowerStrike.call_options.market_data.ltp;

  const middleCallPremium =
    middleStrike.call_options.market_data.ltp;

  const upperCallPremium =
    upperStrike.call_options.market_data.ltp;

  const netDebit = round(
    lowerCallPremium -
      2 * middleCallPremium +
      upperCallPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Butterfly spread does not produce a valid net debit",
    );
  }

  const maxProfit = round(
    strikeWidthLower - netDebit,
  );

  const maxLoss = netDebit;

  const lowerBreakeven = round(
    lowerStrike.strike_price + netDebit,
  );

  const upperBreakeven = round(
    upperStrike.strike_price - netDebit,
  );

  const startIndex = Math.max(
    0,
    atmIndex - recordsEachSide,
  );

  const endIndex = Math.min(
    strikes.length,
    atmIndex + recordsEachSide + 1,
  );

  const nearbyStrikes = strikes.slice(
    startIndex,
    endIndex,
  );

  const payoffTable: ButterflySpreadPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const lowerCallPl =
          Math.max(
            closingPrice - lowerStrike.strike_price,
            0,
          ) - lowerCallPremium;

        const middleCallsPl =
          2 *
          (
            middleCallPremium -
            Math.max(
              closingPrice - middleStrike.strike_price,
              0,
            )
          );

        const upperCallPl =
          Math.max(
            closingPrice - upperStrike.strike_price,
            0,
          ) - upperCallPremium;

        const netPl =
          lowerCallPl +
          middleCallsPl +
          upperCallPl;

        return {
          closing_price: closingPrice,
          lower_call_pl: round(lowerCallPl),
          middle_calls_pl: round(middleCallsPl),
          upper_call_pl: round(upperCallPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    lower_strike: lowerStrike.strike_price,
    middle_strike: middleStrike.strike_price,
    upper_strike: upperStrike.strike_price,

    lower_call_instrument_key:
      lowerStrike.call_options.instrument_key,

    middle_call_instrument_key:
      middleStrike.call_options.instrument_key,

    upper_call_instrument_key:
      upperStrike.call_options.instrument_key,

    lower_call_premium: lowerCallPremium,
    middle_call_premium: middleCallPremium,
    upper_call_premium: upperCallPremium,

    net_debit: netDebit,

    max_profit: maxProfit,
    max_loss: maxLoss,

    lower_breakeven: lowerBreakeven,
    upper_breakeven: upperBreakeven,

    payoff_table: payoffTable,
  };
}