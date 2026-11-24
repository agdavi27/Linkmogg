import { NextResponse, type NextRequest } from "next/server";
import { cleanupDiscovery, runDiscovery } from "@/lib/instagram/discovery";

export const maxDuration = 300;

// Daily (see vercel.json): find new creators, build their previews, and clear out old stored reels.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const discovery = await runDiscovery();
  const cleanup = await cleanupDiscovery();
  return NextResponse.json({ discovery, cleanup });
}
