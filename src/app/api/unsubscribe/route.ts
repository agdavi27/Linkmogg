import { NextResponse, type NextRequest } from "next/server";
import { unsubscribe, validUnsub } from "@/lib/outreach/unsubscribe";

// RFC 8058 one-click unsubscribe (mail clients POST here directly).
export async function POST(req: NextRequest) {
  const e = req.nextUrl.searchParams.get("e") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  if (!e || !validUnsub(e, t)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await unsubscribe(e);
  return NextResponse.json({ ok: true });
}
