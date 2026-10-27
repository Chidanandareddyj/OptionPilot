import { BadRequestError, STRATEGY_DEFINITIONS, parseDecideInput, price, signedInr, type Category, type Decision } from "@optionpilot/shared";
import { ApiError } from "@/lib/api/client";
import { SignedOutError } from "@/lib/auth/errors";
import { VIEW_LABEL } from "./model";

/** What the website starts the loss budget at when nothing has been scored yet. */
export const DEFAULT_MAX_LOSS = 20000;

/** The strategy cards on the result screen: the website's top three. */
export const RANKED_SHOWN = 3;

/** Digits and at most one dot, as typed. Anything else is dropped. */
export function cleanAmount(text: string): string {
  const digits = text.replace(/[^\d.]/g, "");
  const [whole, ...rest] = digits.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

/** "20000" shown as "20,000", keeping a trailing dot or decimals as typed. */
export function groupAmount(text: string): string {
  const [whole, fraction] = text.split(".");
  const grouped = whole === "" ? "" : Number(whole).toLocaleString("en-IN");
  return fraction === undefined ? grouped : `${grouped || "0"}.${fraction}`;
}

/** The amount in rupees, or null when the text is not a positive number. */
export function parseAmount(text: string): number | null {
  const value = Number(text);
  return text !== "" && Number.isFinite(value) && value > 0 ? value : null;
}

/** What the request carries, checked by the same parser the server uses. Null when the server would refuse it. */
export function decideInput(analysisId: string, view: Category, amount: string, pane?: "left" | "right") {
  const maxLoss = parseAmount(amount);
  if (maxLoss === null) return null;
  try {
    return parseDecideInput({ analysisId, view, maxLoss, pane });
  } catch (error) {
    if (error instanceof BadRequestError) return null;
    throw error;
  }
}

/** What the red alert in the sheet says when scoring failed. */
export function decideErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 404 ? "Run the analysis again to get a recommendation, then try again." : error.message;
  }
  if (error instanceof SignedOutError) return "Your session ended. Sign in again, then try again.";
  return "Could not reach OptionPilot. Check your connection and try again.";
}

const pct = (value: number | null | undefined) => (value == null ? "—" : `${(value * 100).toFixed(1)}%`);
export const nameOf = (key: string) => STRATEGY_DEFINITIONS[key]?.name ?? key;

/** "Neutral view · max loss ₹20,000 per trade". */
export function decisionSubtitle(decision: Decision): string {
  return `${VIEW_LABEL[decision.view]} view · max loss ₹${price(decision.max_loss_budget, 0)} per trade`;
}

/** The small labelled values under the title: ATM IV, 30d RV, IV/RV, lot, days to expiry, view, model. */
export function contextBadges(decision: Decision): { label: string; value: string }[] {
  return [
    { label: "ATM IV", value: pct(decision.atm_iv) },
    { label: "30d RV", value: pct(decision.realized_vol_30d) },
    { label: "IV/RV", value: decision.iv_rv_ratio?.toFixed(2) ?? "—" },
    { label: "Lot", value: String(decision.lot_size) },
    { label: "DTE", value: String(decision.days_to_expiry) },
    { label: "View", value: VIEW_LABEL[decision.view] },
    { label: "Model", value: decision.llm === "ok" ? "Mercury Decide" : "unavailable (quant only)" },
  ];
}

export type BestPick = {
  key: string;
  name: string;
  /** "Recommended · top quant score" or "Recommended · model pick". */
  caption: string;
  score: string;
  /** POP, EV, max loss, max profit and lot size, as the card prints them. */
  figures: { label: string; value: string; tone?: "profit" | "loss" }[];
};

/** The recommended strategy's card, or null when none is viable. */
export function bestPick(decision: Decision): BestPick | null {
  const best = decision.best && decision.strategies.find((s) => s.key === decision.best!.key);
  if (!decision.best || !best) return null;
  const m = best.metrics;
  return {
    key: best.key,
    name: nameOf(best.key),
    caption: `Recommended · ${decision.best.source === "llm" ? "model pick" : "top quant score"}`,
    score: best.score.toFixed(0),
    figures: m
      ? [
          { label: "POP", value: pct(m.pop) },
          { label: "EV", value: signedInr(m.ev_per_lot, 2) },
          { label: "Max loss", value: m.max_loss_per_lot == null ? "Unlimited" : signedInr(-Math.abs(m.max_loss_per_lot), 2), tone: "loss" },
          { label: "Max profit", value: m.max_profit_per_lot == null ? "Unlimited" : signedInr(m.max_profit_per_lot, 2), tone: "profit" },
          { label: "Lot size", value: String(m.lot_size) },
        ]
      : [],
  };
}

export type RankedRow = { key: string; position: string; name: string; viable: boolean; score: number; reasons: string[] };

/** The website's top three, in its order: viable first, then by score. */
export function rankedRows(decision: Decision): RankedRow[] {
  return decision.strategies.slice(0, RANKED_SHOWN).map((s, i) => ({
    key: s.key,
    position: String(i + 1).padStart(2, "0"),
    name: nameOf(s.key),
    viable: s.viable,
    score: s.score,
    reasons: s.reasons,
  }));
}

export type SummaryLine = { kind: "heading" | "bullet" | "text"; text: string };

/** The explanation, line by line, with the website's reading of `#` headings and `-` bullets. */
export function summaryLines(text: string): SummaryLine[] {
  return text.split("\n").flatMap<SummaryLine>((line) => {
    const t = line.trim();
    if (!t) return [];
    if (t.startsWith("#")) return [{ kind: "heading", text: t.replace(/^#+\s*/, "") }];
    if (/^[-*•]\s/.test(t)) return [{ kind: "bullet", text: t.replace(/^[-*•]\s+/, "").replaceAll("**", "") }];
    return [{ kind: "text", text: t.replaceAll("**", "") }];
  });
}
