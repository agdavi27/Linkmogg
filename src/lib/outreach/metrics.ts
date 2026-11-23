import "server-only";
import { and, count, eq, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { db, outreachMessages, prospects, subscriptions, suppressions, users } from "@/lib/db";

export const STAGES = [
  ["discovered", "Discovered"], ["preview_built", "Preview built"], ["contacted", "Contacted"], ["opened", "Opened"],
  ["clicked", "Clicked"], ["claimed", "Claimed"], ["trial", "Trial"], ["paid", "Paid"],
] as const;

export async function getMetrics() {
  const monthly = Number(process.env.MONTHLY_PRICE_USD ?? 10);
  const [byStatus, emailAgg, dmAgg, contactedProspects, claimed, removed, activeSubs, finishedTrials] = await Promise.all([
    db.select({ status: prospects.status, n: count() }).from(prospects).groupBy(prospects.status),
    db.select({
      sent: sql<number>`count(*) filter (where ${outreachMessages.sentAt} is not null)::int`,
      opened: sql<number>`count(*) filter (where ${outreachMessages.openedAt} is not null)::int`,
      clicked: sql<number>`count(*) filter (where ${outreachMessages.clickedAt} is not null)::int`,
    }).from(outreachMessages).where(eq(outreachMessages.channel, "email")),
    db.select({ n: count() }).from(outreachMessages).where(and(eq(outreachMessages.channel, "dm"), isNotNull(outreachMessages.sentAt))),
    db.select({ n: sql<number>`count(distinct ${outreachMessages.prospectId})::int` }).from(outreachMessages).where(isNotNull(outreachMessages.sentAt)),
    db.select({ n: count() }).from(prospects).where(isNotNull(prospects.claimedUserId)),
    db.select({ n: count() }).from(suppressions).where(eq(suppressions.reason, "removed")),
    db.select({ n: count() }).from(subscriptions).where(inArray(subscriptions.status, ["active", "past_due"])),
    db.select({ n: count() }).from(users).leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(or(lt(users.trialEndsAt, new Date()), inArray(subscriptions.status, ["active", "past_due", "canceled"]))),
  ]);
  const statusCounts = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>;
  const order: string[] = STAGES.map(([k]) => k);
  const reached = (k: string) => order.slice(order.indexOf(k)).reduce((a, s) => a + (statusCounts[s] ?? 0), 0);
  const e = emailAgg[0];
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  return {
    funnel: STAGES.map(([k, label]) => ({ key: k, label, reached: reached(k), now: statusCounts[k] ?? 0 })),
    unsubscribed: statusCounts.unsubscribed ?? 0,
    removed: removed[0].n,
    emailsSent: e.sent, openRate: pct(e.opened, e.sent), clickRate: pct(e.clicked, e.sent),
    dmsSent: dmAgg[0].n,
    claimRate: pct(claimed[0].n, contactedProspects[0].n), claimed: claimed[0].n, contacted: contactedProspects[0].n,
    paid: activeSubs[0].n, trialToPaid: pct(activeSubs[0].n, finishedTrials[0].n), finishedTrials: finishedTrials[0].n,
    mrr: activeSubs[0].n * monthly,
  };
}
