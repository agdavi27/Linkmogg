import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db, outreachMessages, prospects } from "@/lib/db";
import { advance, logEvent } from "@/lib/outreach/core";
import { emailHash, suppress } from "@/lib/outreach/suppress";

type Evt = { type: string; data: { email_id?: string; to?: string[] } };

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const payload = await req.text();
  let evt: Evt;
  try {
    evt = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    }) as unknown as Evt;
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const id = evt.data?.email_id;
  if (!id) return NextResponse.json({ ok: true });
  const [msg] = await db.select().from(outreachMessages).where(eq(outreachMessages.resendId, id)).limit(1);
  if (!msg) return NextResponse.json({ ok: true }); // transactional mail, not outreach
  const [p] = await db.select().from(prospects).where(eq(prospects.id, msg.prospectId)).limit(1);
  const now = new Date();

  switch (evt.type) {
    case "email.delivered":
      if (msg.status === "sent") await db.update(outreachMessages).set({ status: "delivered" }).where(eq(outreachMessages.id, msg.id));
      break;
    case "email.opened":
      if (!msg.openedAt) {
        await db.update(outreachMessages).set({ openedAt: now, status: msg.clickedAt ? msg.status : "opened" }).where(eq(outreachMessages.id, msg.id));
        if (p) { await advance(p, "opened"); }
      }
      break;
    case "email.clicked":
      if (!msg.clickedAt) {
        await db.update(outreachMessages).set({ clickedAt: now, openedAt: msg.openedAt ?? now, status: "clicked" }).where(eq(outreachMessages.id, msg.id));
        if (p) await advance(p, "clicked");
      }
      break;
    case "email.bounced":
    case "email.complained": {
      const bounced = evt.type === "email.bounced";
      await db.update(outreachMessages).set({ status: bounced ? "bounced" : "complained" }).where(eq(outreachMessages.id, msg.id));
      if (msg.toAddress) await suppress([{ kind: "email", hash: emailHash(msg.toAddress) }], bounced ? "bounce" : "complaint");
      if (p) await logEvent(p.id, bounced ? "bounced" : "complained");
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
