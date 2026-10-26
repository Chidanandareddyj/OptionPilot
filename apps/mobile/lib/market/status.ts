const IST_OFFSET_MS = 5.5 * 3600_000;

/** "14:46", the wall clock in India for the given moment. */
export function formatIstClock(moment: Date): string {
  const ist = new Date(moment.getTime() + IST_OFFSET_MS);
  const hours = String(ist.getUTCHours()).padStart(2, "0");
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export type MarketStatus =
  | { kind: "open"; label: "NSE open"; clock: string }
  | { kind: "closed"; label: "NSE closed" }
  | { kind: "offline"; label: "Offline" };

/** What the status pill above the Terminal title says. */
export function marketStatus(input: { online: boolean; isLive?: boolean; timestamp?: string }): MarketStatus | null {
  if (!input.online) return { kind: "offline", label: "Offline" };
  if (input.isLive === undefined) return null;
  if (!input.isLive) return { kind: "closed", label: "NSE closed" };
  const moment = input.timestamp ? new Date(input.timestamp) : new Date();
  return {
    kind: "open",
    label: "NSE open",
    clock: formatIstClock(Number.isNaN(moment.getTime()) ? new Date() : moment),
  };
}
