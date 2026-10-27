import type { AnalysisSummary, Category } from "@optionpilot/shared";
import type { HistoryPage } from "@/lib/api/client";
import { parseTag, VIEW_LABEL } from "@/lib/analysis/model";

/** The pages the History tab keeps, as React Query's infinite query stores them. */
export type HistoryData = { pages: HistoryPage[]; pageParams: unknown[] };

export const flattenHistory = (data: HistoryData | undefined): AnalysisSummary[] => data?.pages.flatMap((page) => page.analyses) ?? [];

/** What the tag chip on a row shows: its words, and which icon goes with them. */
export type HistoryTag = { label: string; icon: "strategies" | "compare" | Category };

/** "12 strategies", "Compare view", or "Neutral · Put Butterfly" with the view's icon. */
export function historyTag(tag: string): HistoryTag {
  const parsed = parseTag(tag);
  if (parsed.view) return { label: `${VIEW_LABEL[parsed.view]} · ${parsed.name}`, icon: parsed.view };
  if (tag === "Compare view") return { label: tag, icon: "compare" };
  return { label: tag, icon: "strategies" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "23 Oct, 10:27 pm IST", with the hour always two digits as in the list design ("04:48 pm"). */
export function formatHistoryTime(iso: string): string {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return "";
  const ist = new Date(moment.getTime() + 5.5 * 3600_000);
  const hours = ist.getUTCHours();
  const hour = String(hours % 12 || 12).padStart(2, "0");
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]}, ${hour}:${minutes} ${hours >= 12 ? "pm" : "am"} IST`;
}

/** The line under the title. A "+" says there are more pages than the ones loaded so far. */
export function historySubtitle(state: "loading" | "error" | "ready", count: number, hasMore: boolean): string {
  if (state === "loading") return "Loading saved analyses.";
  if (state === "error") return "Could not load your saved analyses.";
  const noun = count === 1 && !hasMore ? "snapshot" : "snapshots";
  const number = `${count}${hasMore ? "+" : ""}`;
  return count === 0 ? "0 saved snapshots." : `${number} saved ${noun}. Open one to reload that analysis.`;
}

const isOlder = (a: AnalysisSummary, b: AnalysisSummary) => (a.createdAt === b.createdAt ? a.id < b.id : a.createdAt < b.createdAt);

/** Puts an analysis into a newest-first list where it belongs. */
export function insertAnalysis(list: AnalysisSummary[], item: AnalysisSummary): AnalysisSummary[] {
  if (list.some((existing) => existing.id === item.id)) return list;
  const at = list.findIndex((existing) => isOlder(existing, item));
  return at === -1 ? [...list, item] : [...list.slice(0, at), item, ...list.slice(at)];
}

export const withoutAnalysis = (list: AnalysisSummary[], id: string) => list.filter((item) => item.id !== id);

/** The pages with one analysis taken out. The cursor stays: it points at the last row the server sent. */
export function removeFromPages(data: HistoryData, id: string): HistoryData {
  return { ...data, pages: data.pages.map((page) => ({ ...page, analyses: withoutAnalysis(page.analyses, id) })) };
}

/**
 * The pages with an analysis put back, into the first page whose successor starts with an older
 * row, so a row that sat at the end of a page returns there. One older than every loaded row goes
 * to the end of the last page.
 */
export function restoreToPages(data: HistoryData, item: AnalysisSummary): HistoryData {
  if (data.pages.some((page) => page.analyses.some((existing) => existing.id === item.id))) return data;
  const last = data.pages.length - 1;
  const target = data.pages.findIndex((_page, index) => {
    const following = data.pages[index + 1]?.analyses[0];
    return index === last || (following !== undefined && isOlder(following, item));
  });
  return {
    ...data,
    pages: data.pages.map((page, index) => (index === target ? { ...page, analyses: insertAnalysis(page.analyses, item) } : page)),
  };
}
