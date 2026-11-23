import { NextResponse, type NextRequest } from "next/server";
import { buildPendingPreviews, runEmailBatch } from "@/lib/outreach/core";

export const maxDuration = 300;

// Called by Vercel Cron (see vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const previews = await buildPendingPreviews(20);
  const emails = await runEmailBatch();
  return NextResponse.json({ previews, emails });
}
