const MODEL = "inception/mercury-decide:free";

type Answer = { noul?: number; choice?: string; confidence?: number };

// Free tier allows 50 requests/day, so everything goes in one request; any failure degrades to quant-only.
export async function askMercury(state: unknown, keys: string[]) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  const label = (key: string) => key.replaceAll("_", " ");
  try {
    const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        state,
        questions: {
          ...Object.fromEntries(
            keys.map((key) => [
              `viable_${key}`,
              {
                type: "noul",
                instructions: `Given the market view, risk budget and metrics in state.strategies.${key}, is the ${label(key)} a sound trade right now?`,
                criteria: {
                  true: "Liquid, within budget, fits the view, and its probability, expected value and reward/risk justify the risk.",
                  false: "Illiquid, over budget, against the view, or its risk is not compensated by its expected payoff.",
                },
              },
            ]),
          ),
          best: {
            type: "choice",
            instructions: "Which single strategy is the best trade for this market view and risk budget?",
            criteria: {
              ...Object.fromEntries(keys.map((key) => [key, label(key)])),
              none: "No strategy is worth trading right now.",
            },
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const { answers } = (await response.json()) as { answers?: Record<string, Answer> };
    const viable = Object.fromEntries(keys.map((key) => [key, answers?.[`viable_${key}`]?.noul]));
    const best = answers?.best;
    if (Object.values(viable).some((p) => typeof p !== "number" || p < 0 || p > 1) || typeof best?.choice !== "string") {
      throw new Error(`Malformed answers: ${JSON.stringify(answers)}`);
    }
    return { viable: viable as Record<string, number>, best: best.choice, confidence: best.confidence ?? null };
  } catch (error) {
    console.warn("Mercury Decide unavailable:", error);
    return null;
  }
}
