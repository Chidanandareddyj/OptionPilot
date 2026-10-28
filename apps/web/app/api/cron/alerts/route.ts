import { createAlertsCronHandler, sendExpoPush } from "@/lib/alerts-cron";
import { prisma } from "@/lib/db";
import { equityQuotes } from "@/lib/equity-quotes";

export const dynamic = "force-dynamic";

export const GET = createAlertsCronHandler({
  secret: process.env.CRON_SECRET,
  now: () => new Date(),
  devices: () => prisma.device.findMany({ select: { userId: true, token: true } }),
  analyses: (userIds) =>
    prisma.analysis.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true, company: true, result: true, decision: true },
    }),
  prices: async (symbols) => new Map((await equityQuotes(symbols)).map((quote) => [quote.symbol, quote.price])),
  sentKeys: async (day) => {
    const rows = await prisma.alertSent.findMany({ where: { istDate: day }, select: { userId: true, analysisId: true, kind: true } });
    return new Set(rows.map((row) => `${row.userId}\t${row.analysisId}\t${row.kind}`));
  },
  record: (row) => prisma.alertSent.create({ data: row }).then(() => undefined),
  push: (messages) => sendExpoPush(messages),
  dropTokens: (tokens) => prisma.device.deleteMany({ where: { token: { in: tokens } } }).then(() => undefined),
});
