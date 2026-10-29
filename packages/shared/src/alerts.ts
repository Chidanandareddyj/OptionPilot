import { parseStoredDecision } from "./analysis";
import { checkIsMarketOpen } from "./market";
import { inr, normalizeStrategy } from "./types";

export type AlertKind = "move" | "breakeven";

/** A move alert fires above this fraction of the saved spot. 2% itself does not. */
export const MOVE_FRACTION = 0.02;

/** `YYYY-MM-DD` in IST, using the same clock shift as `checkIsMarketOpen`. */
export function istDate(now = new Date()): string {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const month = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return `${ist.getFullYear()}-${month}-${day}`;
}

export const alertsAllowed = (now = new Date()) => checkIsMarketOpen(now);

/**
 * Which alerts a saved snapshot earns at this live price.
 * A breakeven counts only when it sits strictly between the saved spot and the live price.
 */
export function snapshotAlerts(input: { savedSpot: number; livePrice: number; breakevens: number[] }): AlertKind[] {
  const { savedSpot, livePrice, breakevens } = input;
  if (!(savedSpot > 0) || !(livePrice > 0)) return [];
  const kinds: AlertKind[] = [];
  const low = Math.min(savedSpot, livePrice);
  const high = Math.max(savedSpot, livePrice);
  if (breakevens.some((b) => Number.isFinite(b) && low < b && b < high)) kinds.push("breakeven");
  if (Math.abs(livePrice - savedSpot) / savedSpot > MOVE_FRACTION) kinds.push("move");
  return kinds;
}

function bestBreakevens(result: Record<string, unknown>, decision: unknown): number[] {
  if (!decision || typeof decision !== "object") return [];
  const key = (decision as { best?: { key?: unknown } }).best?.key;
  if (typeof key !== "string") return [];
  return normalizeStrategy(key, result[key])?.breakevens ?? [];
}

/** Breakevens of the saved best strategy. A compare snapshot uses each pane's best strategy. */
export function savedBreakevens(result: unknown, decision: unknown): number[] {
  const record = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  const stored = parseStoredDecision(decision);
  const parts = stored.mode === "compare" ? [stored.left, stored.right] : [stored.single];
  return parts.flatMap((part) => bestBreakevens(record, part));
}

export function alertCopy(input: { company: string; kind: AlertKind; savedSpot: number; livePrice: number }): { title: string; body: string } {
  const body = `Saved spot was ${inr(input.savedSpot)}. It is now ${inr(input.livePrice)}.`;
  if (input.kind === "breakeven") return { title: `${input.company} crossed a breakeven`, body };
  const pct = (Math.abs(input.livePrice - input.savedSpot) / input.savedSpot) * 100;
  return { title: `${input.company} moved ${pct.toFixed(1)}%`, body };
}
