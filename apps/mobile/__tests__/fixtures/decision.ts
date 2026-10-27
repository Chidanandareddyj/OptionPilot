import { rankDecision, scoreStrategies, type Decision, type DecisionChain as Chain } from "@optionpilot/shared";
import { LOT_SIZE, analysisResult, optionChain } from "./analysis";

export type View = "bullish" | "bearish" | "neutral" | "volatile";

const NOW = Date.parse("2026-10-23T10:00:00+05:30");

/** The fixture chain with a two-sided, deep market on every strike, so liquidity never rules a strategy out. */
function liquidChain(): Chain {
  const quote = (ltp: number) => ({ ltp, bid_price: ltp - 0.1, ask_price: ltp + 0.1, oi: 1_000_000 });
  return {
    data: optionChain().data.map((row) => ({
      ...row,
      call_options: { ...row.call_options, market_data: quote(row.call_options.market_data.ltp), option_greeks: { iv: 22 } },
      put_options: { ...row.put_options, market_data: quote(row.put_options.market_data.ltp), option_greeks: { iv: 22 } },
    })),
  } as unknown as Chain;
}

/** What POST /api/decide returns for the fixture analysis: the server's own scoring and ranking, no language model. */
export function decide(view: View, maxLoss = 20000): Decision {
  return rankDecision(
    scoreStrategies({ result: analysisResult(), chain: liquidChain(), lotSize: LOT_SIZE, closes: [], view, maxLoss, now: NOW }),
    null,
  );
}
