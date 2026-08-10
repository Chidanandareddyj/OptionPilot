type OptionChainStrike = {
  strike_price: number;
  underlying_spot_price: number;
};

type OptionChainResponse = {
  data: OptionChainStrike[];
};

export function getAtmStrike(chain: OptionChainResponse) {
  const strikes = chain.data;
  if (!strikes.length) {
    return null;
  }

  const spot = strikes[0].underlying_spot_price;

  return strikes.reduce((closest, current) =>
    Math.abs(current.strike_price - spot) <
    Math.abs(closest.strike_price - spot)
      ? current
      : closest,
  );
}
