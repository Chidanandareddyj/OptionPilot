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

export type PutCondorPayoff = {
  closing_price: number;
  lower_put_pl: number;
  lower_middle_put_pl: number;
  upper_middle_put_pl: number;
  upper_put_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculatePutCondor(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a put condor from an empty option chain",
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
    atmIndex < 2 ||
    atmIndex + 2 >= strikes.length
  ) {
    throw new Error(
      "Not enough option strikes to construct a put condor",
    );
  }

  const lowerStrike = strikes[atmIndex - 2];
  const lowerMiddleStrike = strikes[atmIndex - 1];
  const upperMiddleStrike = strikes[atmIndex + 1];
  const upperStrike = strikes[atmIndex + 2];

  const width1 =
    lowerMiddleStrike.strike_price -
    lowerStrike.strike_price;

  const upperWidth =
    upperStrike.strike_price -
    upperMiddleStrike.strike_price;

  if (width1 !== upperWidth) {
    throw new Error(
      "Selected put condor wings are not equally spaced",
    );
  }

  const lowerPutPremium =
    lowerStrike.put_options.market_data.ltp;

  const lowerMiddlePutPremium =
    lowerMiddleStrike.put_options.market_data.ltp;

  const upperMiddlePutPremium =
    upperMiddleStrike.put_options.market_data.ltp;

  const upperPutPremium =
    upperStrike.put_options.market_data.ltp;

  /*
    Put Condor:

    Buy  1 lower-strike Put
    Sell  1 lower-middle-strike Put
    Sell  1 upper-middle-strike Put
    Buy  1 upper-strike Put
  */

  const netDebit = round(
    lowerPutPremium -
      lowerMiddlePutPremium -
      upperMiddlePutPremium +
      upperPutPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Put condor does not produce a valid net debit",
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

  const nearbyStrikes = strikes.slice(
    Math.max(0, atmIndex - recordsEachSide),
    atmIndex + recordsEachSide + 1,
  );

  const payoffTable: PutCondorPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const lowerPutPl =
          Math.max(
            lowerStrike.strike_price -
              closingPrice,
            0,
          ) - lowerPutPremium;

        const lowerMiddlePutPl =
          lowerMiddlePutPremium -
          Math.max(
            lowerMiddleStrike.strike_price -
              closingPrice,
            0,
          );

        const upperMiddlePutPl =
          upperMiddlePutPremium -
          Math.max(
            upperMiddleStrike.strike_price -
              closingPrice,
            0,
          );

        const upperPutPl =
          Math.max(
            upperStrike.strike_price -
              closingPrice,
            0,
          ) - upperPutPremium;

        const netPl =
          lowerPutPl +
          lowerMiddlePutPl +
          upperMiddlePutPl +
          upperPutPl;

        return {
          closing_price: closingPrice,
          lower_put_pl: round(lowerPutPl),
          lower_middle_put_pl:
            round(lowerMiddlePutPl),
          upper_middle_put_pl:
            round(upperMiddlePutPl),
          upper_put_pl: round(upperPutPl),
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

    lower_put_instrument_key:
      lowerStrike.put_options.instrument_key,

    lower_middle_put_instrument_key:
      lowerMiddleStrike.put_options.instrument_key,

    upper_middle_put_instrument_key:
      upperMiddleStrike.put_options.instrument_key,

    upper_put_instrument_key:
      upperStrike.put_options.instrument_key,

    lower_put_premium:
      lowerPutPremium,

    lower_middle_put_premium:
      lowerMiddlePutPremium,

    upper_middle_put_premium:
      upperMiddlePutPremium,

    upper_put_premium:
      upperPutPremium,

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