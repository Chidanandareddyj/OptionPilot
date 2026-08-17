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

export type BullPutSpreadPayoff = {
  closing_price: number;
  short_put_pl: number;
  long_put_pl: number;
  net_pl: number;
};

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function calculateBullPutSpread(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a bull put spread from an empty option chain",
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

  if (atmIndex === 0) {
    throw new Error(
      "Not enough option strikes to construct a bull put spread",
    );
  }

  // Sell higher-strike put
  const higherStrike = strikes[atmIndex];

  // Buy lower-strike put
  const lowerStrike = strikes[atmIndex - 1];

  const higherPutPremium =
    higherStrike.put_options.market_data.ltp;

  const lowerPutPremium =
    lowerStrike.put_options.market_data.ltp;

  // Bull put spread receives a net credit
  const netCredit = round(
    higherPutPremium - lowerPutPremium,
  );

  if (netCredit <= 0) {
    throw new Error(
      "Bull put spread does not produce a valid net credit",
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
    higherStrike.strike_price - netCredit,
  );

  const startIndex = Math.max(
    0,
    atmIndex - recordsEachSide - 1,
  );

  const endIndex = Math.min(
    strikes.length,
    atmIndex + recordsEachSide + 1,
  );

  const nearbyStrikes = strikes.slice(
    startIndex,
    endIndex,
  );

  const payoffTable: BullPutSpreadPayoff[] =
    nearbyStrikes.map(
      ({ strike_price: closingPrice }) => {
        // Short higher-strike put
        const shortPutPl =
          higherPutPremium -
          Math.max(
            higherStrike.strike_price -
              closingPrice,
            0,
          );

        // Long lower-strike put
        const longPutPl =
          Math.max(
            lowerStrike.strike_price -
              closingPrice,
            0,
          ) - lowerPutPremium;

        const netPl =
          shortPutPl + longPutPl;

        return {
          closing_price: closingPrice,
          short_put_pl: round(shortPutPl),
          long_put_pl: round(longPutPl),
          net_pl: round(netPl),
        };
      },
    );

  return {
    spot_price: spotPrice,

    higher_strike:
      higherStrike.strike_price,

    lower_strike:
      lowerStrike.strike_price,

    higher_put_instrument_key:
      higherStrike.put_options.instrument_key,

    lower_put_instrument_key:
      lowerStrike.put_options.instrument_key,

    higher_put_premium:
      higherPutPremium,

    lower_put_premium:
      lowerPutPremium,

    net_credit: netCredit,

    max_profit: maxProfit,

    max_loss: maxLoss,

    breakeven,

    payoff_table: payoffTable,
  };
}