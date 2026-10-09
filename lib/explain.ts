const MODEL = "inclusionai/ling-3.1-flash";

const SYSTEM = `You explain options strategy recommendations for Indian retail traders (NSE, rupees).
You receive a JSON decision computed by a quant model. Use ONLY the numbers and reasons in it; never invent prices, strikes or probabilities.
Glossary: pop = probability of profit at expiry; ev_per_lot = expected value per lot in rupees; net_premium > 0 is a debit paid, < 0 a credit received (per share); atm_iv and realized_vol_30d are annualized decimals (0.24 = 24%); iv_rv_ratio > 1 means options are priced rich vs recent movement; undefined_risk max loss is a 2-sigma move estimate.
Write plain text in exactly these sections, each starting with a line "## <title>":
## Recommendation — 2-3 sentences: which strategy, its legs (buy/sell, CE/PE, strike), and score. If best is null, say no strategy is viable and why.
## Why this strategy — 3-5 "- " bullets tying it to the user's view, max loss budget, pop, ev, reward/risk and the IV vs realized vol regime.
## Risks — 2-3 "- " bullets: max loss per lot, breakevens, what market move hurts it.
## Other strategies — one "- " bullet per other strategy in ranked order: "<Name> (score N, viable|not viable): <short reason>".
Use simple language, explain jargon briefly the first time, no markdown bold or tables. End with one line: "This is not financial advice."`;

export async function explainDecision(decision: unknown) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  const request = () =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 2000,
        // Ling is a reasoning model; left on, it spends the whole token budget thinking and returns no content.
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(decision) },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
  try {
    let response = await request();
    // Free models share an upstream pool that 429s in bursts; one delayed retry usually clears it.
    if (response.status === 429) {
      await new Promise((r) => setTimeout(r, 3000));
      response = await request();
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error(`Empty completion: ${JSON.stringify(data)}`);
    return text;
  } catch (error) {
    console.warn("Explanation unavailable:", error);
    return null;
  }
}
