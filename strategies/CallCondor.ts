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

export type CallCondorPayoff = {
  closing_price: number;
  lower_call_pl: number;
  lower_middle_call_pl: number;
  upper_middle_call_pl: number;
  upper_call_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculateCallCondor(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a call condor from an empty option chain",
    );
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );

  const spotPrice =
    strikes[0].underlying_spot_price;

  const atmIndex = strikes.reduce(
    (
      closestIndex,
      current,
      currentIndex,
      allStrikes,
    ) =>
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

  if (
    atmIndex < 1 ||
    atmIndex + 2 >= strikes.length
  ) {
    throw new Error(
      "Not enough option strikes to construct a call condor",
    );
  }

  const lowerStrike = strikes[atmIndex - 1];
  const lowerMiddleStrike = strikes[atmIndex];
  const upperMiddleStrike = strikes[atmIndex + 1];
  const upperStrike = strikes[atmIndex + 2];

  const width1 =
    lowerMiddleStrike.strike_price -
    lowerStrike.strike_price;

  const width2 =
    upperMiddleStrike.strike_price -
    lowerMiddleStrike.strike_price;

  const width3 =
    upperStrike.strike_price -
    upperMiddleStrike.strike_price;

  if (
    width1 !== width2 ||
    width2 !== width3
  ) {
    throw new Error(
      "Selected strikes are not equally spaced for a balanced call condor",
    );
  }

  const lowerCallPremium =
    lowerStrike.call_options.market_data.ltp;

  const lowerMiddleCallPremium =
    lowerMiddleStrike.call_options.market_data.ltp;

  const upperMiddleCallPremium =
    upperMiddleStrike.call_options.market_data.ltp;

  const upperCallPremium =
    upperStrike.call_options.market_data.ltp;

  /*
    Call Condor:

    Buy  1 lower-strike Call
    Sell  1 lower-middle-strike Call
    Sell  1 upper-middle-strike Call
    Buy  1 upper-strike Call
  */

  const netDebit = round(
    lowerCallPremium -
      lowerMiddleCallPremium -
      upperMiddleCallPremium +
      upperCallPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Call condor does not produce a valid net debit",
    );
  }

  const maxProfit = round(
    width1 - netDebit,
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
    atmIndex + recordsEachSide + 2,
  );

  const nearbyStrikes = strikes.slice(
    startIndex,
    endIndex,
  );

  const payoffTable: CallCondorPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const lowerCallPl =
          Math.max(
            closingPrice -
              lowerStrike.strike_price,
            0,
          ) - lowerCallPremium;

        const lowerMiddleCallPl =
          lowerMiddleCallPremium -
          Math.max(
            closingPrice -
              lowerMiddleStrike.strike_price,
            0,
          );

        const upperMiddleCallPl =
          upperMiddleCallPremium -
          Math.max(
            closingPrice -
              upperMiddleStrike.strike_price,
            0,
          );

        const upperCallPl =
          Math.max(
            closingPrice -
              upperStrike.strike_price,
            0,
          ) - upperCallPremium;

        const netPl =
          lowerCallPl +
          lowerMiddleCallPl +
          upperMiddleCallPl +
          upperCallPl;

        return {
          closing_price: closingPrice,
          lower_call_pl: round(lowerCallPl),
          lower_middle_call_pl:
            round(lowerMiddleCallPl),
          upper_middle_call_pl:
            round(upperMiddleCallPl),
          upper_call_pl: round(upperCallPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    lower_strike:
      lowerStrike.strike_price,

    lower_middle_strike:
      lowerMiddleStrike.strike_price,

    upper_middle_strike:
      upperMiddleStrike.strike_price,

    upper_strike:
      upperStrike.strike_price,

    lower_call_instrument_key:
      lowerStrike.call_options.instrument_key,

    lower_middle_call_instrument_key:
      lowerMiddleStrike.call_options.instrument_key,

    upper_middle_call_instrument_key:
      upperMiddleStrike.call_options.instrument_key,

    upper_call_instrument_key:
      upperStrike.call_options.instrument_key,

    lower_call_premium:
      lowerCallPremium,

    lower_middle_call_premium:
      lowerMiddleCallPremium,

    upper_middle_call_premium:
      upperMiddleCallPremium,

    upper_call_premium:
      upperCallPremium,

    net_debit: netDebit,

    max_profit: maxProfit,

    max_loss: maxLoss,

    lower_breakeven:
      lowerBreakeven,

    upper_breakeven:
      upperBreakeven,

    payoff_table: payoffTable,
  };
}