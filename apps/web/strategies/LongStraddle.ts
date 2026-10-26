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

export type LongStraddlePayoff = {
  closing_price: number;
  call_pl: number;
  put_pl: number;
  net_pl: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateLongStraddle(
  chain: OptionChainResponse,
  recordsEachSide = 10,
) {
  if (!chain.data.length) {
    throw new Error("Cannot calculate a long straddle from an empty option chain");
  }

  const strikes = [...chain.data].sort(
    (a, b) => a.strike_price - b.strike_price,
  );
  const spotPrice = strikes[0].underlying_spot_price;
  const atmIndex = strikes.reduce(
    (closestIndex, current, currentIndex, strikes) =>
      Math.abs(current.strike_price - spotPrice) <
      Math.abs(strikes[closestIndex].strike_price - spotPrice)
        ? currentIndex
        : closestIndex,
    0,
  );

  const atm = strikes[atmIndex];
  const callPremium = atm.call_options.market_data.ltp;
  const putPremium = atm.put_options.market_data.ltp;
  const nearbyStrikes = strikes.slice(
    Math.max(0, atmIndex - recordsEachSide),
    atmIndex + recordsEachSide + 1,
  );

  const payoffTable: LongStraddlePayoff[] = nearbyStrikes.map(
    ({ strike_price: closingPrice }) => {
      const callPl =
        Math.max(closingPrice - atm.strike_price, 0) - callPremium;
      const putPl =
        Math.max(atm.strike_price - closingPrice, 0) - putPremium;

      return {
        closing_price: closingPrice,
        call_pl: round(callPl),
        put_pl: round(putPl),
        net_pl: round(callPl + putPl),
      };
    },
  );

  return {
    spot_price: spotPrice,
    strike_price: atm.strike_price,
    call_instrument_key: atm.call_options.instrument_key,
    put_instrument_key: atm.put_options.instrument_key,
    call_premium: callPremium,
    put_premium: putPremium,
    total_premium: round(callPremium + putPremium),
    lower_breakeven: round(
      atm.strike_price - callPremium - putPremium,
    ),
    upper_breakeven: round(
      atm.strike_price + callPremium + putPremium,
    ),
    payoff_table: payoffTable,
  };
}
