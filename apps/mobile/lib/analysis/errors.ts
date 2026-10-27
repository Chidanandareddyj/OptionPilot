import { SignedOutError } from "@/lib/auth/errors";
import { ApiError } from "@/lib/api/client";

/** What the red alert on the Terminal says when an analysis could not be made. */
export function analysisErrorMessage(error: unknown, symbol: string): string {
  if (error instanceof ApiError && /instrument|option|strike|expiry|not found/i.test(error.message)) {
    return `No option chain found for ${symbol}. Check the symbol and try again.`;
  }
  if (error instanceof ApiError || error instanceof SignedOutError) {
    return `Could not analyse ${symbol} right now. Try again in a moment.`;
  }
  return "Could not reach OptionPilot. Check your connection and try again.";
}
