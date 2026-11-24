import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { currentUser, isAdmin, randomToken } from "@/lib/auth";
import { connectUrl } from "@/lib/instagram/client";

/** Admin only: sends you to Facebook's login to connect Linkmogg's own Instagram business account. */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!isAdmin(user)) return NextResponse.redirect(new URL("/login?next=/admin/discovery", req.url));
  if (!process.env.META_APP_ID) return NextResponse.redirect(new URL("/admin/discovery?msg=" + encodeURIComponent("Add META_APP_ID and META_APP_SECRET in Vercel first."), req.url));
  const state = randomToken(16);
  (await cookies()).set("lm_ig_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/api/instagram" });
  return NextResponse.redirect(connectUrl(state, new URL("/api/instagram/callback", req.url).toString()));
}
