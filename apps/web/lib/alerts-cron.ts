import {
  alertCopy,
  alertsAllowed,
  analysisSpot,
  istDate,
  savedBreakevens,
  snapshotAlerts,
  type AlertKind,
} from "@optionpilot/shared";

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: { analysisId: string };
};

export type AlertDevice = { userId: string; token: string };
export type AlertAnalysis = { id: string; userId: string; company: string; result: unknown; decision: unknown };
export type PushResult = { ok: boolean; drop: boolean };

export type AlertsCronDeps = {
  secret: string | undefined;
  now: () => Date;
  devices: () => Promise<AlertDevice[]>;
  analyses: (userIds: string[]) => Promise<AlertAnalysis[]>;
  prices: (symbols: string[]) => Promise<Map<string, number>>;
  /** Keys already sent today: `${userId}\t${analysisId}\t${kind}`. */
  sentKeys: (day: string) => Promise<Set<string>>;
  record: (row: { userId: string; analysisId: string; kind: AlertKind; istDate: string }) => Promise<void>;
  push: (messages: PushMessage[]) => Promise<PushResult[]>;
  dropTokens: (tokens: string[]) => Promise<void>;
};

const sentKey = (userId: string, analysisId: string, kind: string) => `${userId}\t${analysisId}\t${kind}`;

export function parseExpoPush(body: unknown, count: number): PushResult[] {
  const data = body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data) ? (body as { data: unknown[] }).data : [];
  return Array.from({ length: count }, (_, index) => {
    const row = data[index];
    if (!row || typeof row !== "object") return { ok: false, drop: false };
    const status = (row as { status?: unknown }).status;
    const error = (row as { details?: { error?: unknown } }).details?.error;
    if (status === "ok") return { ok: true, drop: false };
    return { ok: false, drop: error === "DeviceNotRegistered" };
  });
}

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Posts to Expo in batches of 100. A failed request leaves those messages unsent so the next run retries. */
export async function sendExpoPush(messages: PushMessage[], fetchImpl: typeof fetch = fetch): Promise<PushResult[]> {
  const results: PushResult[] = [];
  for (let index = 0; index < messages.length; index += 100) {
    const batch = messages.slice(index, index + 100);
    try {
      const response = await fetchImpl(EXPO_PUSH_URL, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(batch),
      });
      const body: unknown = response.ok ? await response.json() : null;
      results.push(...(response.ok ? parseExpoPush(body, batch.length) : batch.map(() => ({ ok: false, drop: false }))));
    } catch {
      results.push(...batch.map(() => ({ ok: false, drop: false })));
    }
  }
  return results;
}

function authorized(request: Request, secret: string | undefined): boolean {
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

type Pending = { message: PushMessage; userId: string; analysisId: string; kind: AlertKind; istDate: string };

/** `GET /api/cron/alerts`. Sends nothing unless the caller knows CRON_SECRET and NSE is open. */
export function createAlertsCronHandler(deps: AlertsCronDeps) {
  return async function handle(request: Request): Promise<Response> {
    if (!authorized(request, deps.secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const now = deps.now();
    if (!alertsAllowed(now)) return Response.json({ sent: 0, skipped: "closed" });

    const devices = await deps.devices();
    if (devices.length === 0) return Response.json({ sent: 0 });
    const userIds = [...new Set(devices.map((device) => device.userId))];
    const analyses = await deps.analyses(userIds);
    const symbols = [...new Set(analyses.map((row) => row.company))];
    const prices = symbols.length ? await deps.prices(symbols) : new Map<string, number>();
    const day = istDate(now);
    const sent = await deps.sentKeys(day);
    const tokens = new Map<string, string[]>();
    for (const device of devices) {
      const list = tokens.get(device.userId) ?? [];
      list.push(device.token);
      tokens.set(device.userId, list);
    }

    const pending: Pending[] = [];
    for (const analysis of analyses) {
      const savedSpot = analysisSpot(analysis.result);
      const livePrice = prices.get(analysis.company);
      if (savedSpot == null || livePrice == null) continue;
      const kinds = snapshotAlerts({ savedSpot, livePrice, breakevens: savedBreakevens(analysis.result, analysis.decision) });
      for (const kind of kinds) {
        if (sent.has(sentKey(analysis.userId, analysis.id, kind))) continue;
        const copy = alertCopy({ company: analysis.company, kind, savedSpot, livePrice });
        for (const token of tokens.get(analysis.userId) ?? []) {
          pending.push({
            message: { to: token, title: copy.title, body: copy.body, sound: "default", data: { analysisId: analysis.id } },
            userId: analysis.userId,
            analysisId: analysis.id,
            kind,
            istDate: day,
          });
        }
      }
    }

    if (pending.length === 0) return Response.json({ sent: 0 });
    const results = await deps.push(pending.map((row) => row.message));
    const groups = new Map<string, { row: Pending; results: PushResult[] }>();
    const drop: string[] = [];
    let count = 0;
    for (let index = 0; index < pending.length; index += 1) {
      const result = results[index] ?? { ok: false, drop: false };
      const row = pending[index];
      const key = sentKey(row.userId, row.analysisId, row.kind);
      const group = groups.get(key) ?? { row, results: [] };
      group.results.push(result);
      groups.set(key, group);
      if (result.drop) drop.push(row.message.to);
      if (result.ok) count += 1;
    }
    // ponytail: a failed send to one live phone skips the record, so the next run retries every phone. A dead token is removed and does not block the record.
    for (const group of groups.values()) {
      const live = group.results.filter((result) => !result.drop);
      if (live.length === 0 || !live.every((result) => result.ok)) continue;
      try {
        await deps.record({ userId: group.row.userId, analysisId: group.row.analysisId, kind: group.row.kind, istDate: group.row.istDate });
      } catch (error) {
        console.error("[/api/cron/alerts record error]:", error);
      }
    }
    if (drop.length > 0) await deps.dropTokens([...new Set(drop)]).catch(() => {});
    return Response.json({ sent: count });
  };
}
