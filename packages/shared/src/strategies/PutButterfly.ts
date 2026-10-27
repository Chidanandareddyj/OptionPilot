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

export type PutButterflyPayoff = {
  closing_price: number;
  lower_put_pl: number;
  middle_puts_pl: number;
  upper_put_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculatePutButterfly(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a put butterfly from an empty option chain",
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
    atmIndex === 0 ||
    atmIndex === strikes.length - 1
  ) {
    throw new Error(
      "Not enough option strikes to construct a put butterfly",
    );
  }

  const lowerStrike = strikes[atmIndex - 1];
  const middleStrike = strikes[atmIndex];
  const upperStrike = strikes[atmIndex + 1];

  const strikeWidthLower =
    middleStrike.strike_price -
    lowerStrike.strike_price;

  const strikeWidthUpper =
    upperStrike.strike_price -
    middleStrike.strike_price;

  if (strikeWidthLower !== strikeWidthUpper) {
    throw new Error(
      "Selected strikes are not equally spaced for a balanced put butterfly",
    );
  }

  const lowerPutPremium =
    lowerStrike.put_options.market_data.ltp;

  const middlePutPremium =
    middleStrike.put_options.market_data.ltp;

  const upperPutPremium =
    upperStrike.put_options.market_data.ltp;

  /*
    Put butterfly:
    Buy 1 lower-strike put
    Sell 2 middle-strike puts
    Buy 1 upper-strike put
  */

  const netDebit = round(
    lowerPutPremium -
      2 * middlePutPremium +
      upperPutPremium,
  );

  if (netDebit <= 0) {
    throw new Error(
      "Put butterfly does not produce a valid net debit",
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

  const payoffTable: PutButterflyPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        const lowerPutPl =
          Math.max(
            lowerStrike.strike_price -
              closingPrice,
            0,
          ) - lowerPutPremium;

        const middlePutsPl =
          2 *
          (
            middlePutPremium -
            Math.max(
              middleStrike.strike_price -
                closingPrice,
              0,
            )
          );

        const upperPutPl =
          Math.max(
            upperStrike.strike_price -
              closingPrice,
            0,
          ) - upperPutPremium;

        const netPl =
          lowerPutPl +
          middlePutsPl +
          upperPutPl;

        return {
          closing_price: closingPrice,
          lower_put_pl: round(lowerPutPl),
          middle_puts_pl: round(middlePutsPl),
          upper_put_pl: round(upperPutPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    lower_strike:
      lowerStrike.strike_price,

    middle_strike:
      middleStrike.strike_price,

    upper_strike:
      upperStrike.strike_price,

    lower_put_instrument_key:
      lowerStrike.put_options.instrument_key,

    middle_put_instrument_key:
      middleStrike.put_options.instrument_key,

    upper_put_instrument_key:
      upperStrike.put_options.instrument_key,

    lower_put_premium:
      lowerPutPremium,

    middle_put_premium:
      middlePutPremium,

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