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

export type ShortStranglePayoff = {
  closing_price: number;
  call_pl: number;
  put_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateShortStrangle(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error(
      "Cannot calculate a short strangle from an empty option chain",
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
  const otmPutIndex = strikes.findLastIndex(
    ({ strike_price }) => strike_price < spotPrice,
  );
  const otmCallIndex = strikes.findIndex(
    ({ strike_price }) => strike_price > spotPrice,
  );

  if (otmPutIndex < 0 || otmCallIndex < 0) {
    throw new Error(
      "Could not find valid OTM Put and OTM Call strikes for Short Strangle",
    );
  }

  const putStrike = strikes[otmPutIndex];
  const callStrike = strikes[otmCallIndex];

  const putPremium = putStrike.put_options.market_data.ltp;
  const callPremium = callStrike.call_options.market_data.ltp;

  const nearbyStrikes = strikes.slice(
    Math.max(0, atmIndex - recordsEachSide),
    atmIndex + recordsEachSide + 1,
  );

  const payoffTable: ShortStranglePayoff[] = nearbyStrikes.map(
    ({ strike_price: closingPrice }) => {

      // Short OTM Call P&L
      const callPl =
        callPremium -
        Math.max(closingPrice - callStrike.strike_price, 0);

      // Short OTM Put P&L
      const putPl =
        putPremium -
        Math.max(putStrike.strike_price - closingPrice, 0);

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

    // Maximum profit
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