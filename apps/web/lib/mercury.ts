import { OpenRouter } from "@openrouter/sdk";

const MODEL = "respan/span-01-lite:free";

type Answer = { noul?: number; type?: string };

// Free tier allows 50 requests/day, so everything goes in one request; any failure degrades to quant-only.
export async function askMercury(state: unknown, keys: string[]) {
  if (!process.env.OPENROUTER_API_KEY || !keys.length) return null;
  const label = (key: string) => key.replaceAll("_", " ");
  try {
    const openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const stringState = typeof state === "string" ? state : JSON.stringify(state, null, 2);

    const questions = Object.fromEntries(
      keys.map((key) => [
        `viable_${key}`,
        {
          type: "noul" as const,
          instructions: `Given the market view, risk budget and metrics in state.strategies.${key}, is the ${label(key)} a sound trade right now?`,
          criteria: {
            true: "Liquid, within budget, fits the view, and its probability, expected value and reward/risk justify the risk.",
            false: "Illiquid, over budget, against the view, or its risk is not compensated by its expected payoff.",
          },
        },
      ]),
    );

    const response = await openrouter.alpha.decisions.create(
      {
        decisionsRequest: {
          model: MODEL,
          state: stringState,
          questions,
        },
      },
      { timeoutMs: 10_000 },
    );

    const answers = response.answers as Record<string, Answer> | undefined;
    if (!answers) {
      throw new Error("No answers returned from OpenRouter Decision API");
    }

    const viable: Record<string, number> = {};
    let bestKey: string | null = null;
    let highestScore = -1;

    for (const key of keys) {
      const score = answers[`viable_${key}`]?.noul;
      if (typeof score !== "number" || score < 0 || score > 1) {
        throw new Error(`Malformed answer for viable_${key}: ${JSON.stringify(answers[`viable_${key}`])}`);
      }
      viable[key] = score;
      if (score > highestScore) {
        highestScore = score;
        bestKey = key;
      }
    }

    const best = highestScore >= 0.5 && bestKey ? bestKey : "none";
    const confidence = highestScore >= 0 ? highestScore : null;

    return { viable, best, confidence };
  } catch (error) {
    console.warn("Span-01 Decision unavailable:", error);
    return null;
  }
}

export const askDecision = askMercury;
