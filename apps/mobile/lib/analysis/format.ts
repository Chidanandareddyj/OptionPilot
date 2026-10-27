import { price } from "@optionpilot/shared";

const MINUS = "\u2212";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1,190.00". Rupee amounts in the app are grouped the Indian way. */
export const money = (value: number, digits = 2) => price(value, digits);

/** "+4,200", "−4,300" or "0": a sign on every non-zero amount, so colour is never the only cue. */
export function signed(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return "0";
  const body = price(Math.abs(rounded), digits);
  return rounded > 0 ? `+${body}` : `${MINUS}${body}`;
}

/** "+0.42%" or "−1.13%". */
export const signedPercent = (value: number, digits = 2) => `${signed(value, digits)}%`;

/** "2026-10-27" to "27 Oct 2026". Parsed by hand: a Date would shift the day by time zone. */
export function formatExpiry(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

/** "23 Oct, 10:27 pm IST" for a stored ISO timestamp. */
export function formatSavedAt(iso: string): string {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return "";
  const ist = new Date(moment.getTime() + 5.5 * 3600_000);
  const hours = ist.getUTCHours();
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "pm" : "am";
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]}, ${hours % 12 || 12}:${minutes} ${meridiem} IST`;
}

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
