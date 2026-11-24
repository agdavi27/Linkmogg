import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { currentUser, isAdmin } from "@/lib/auth";
import { finishConnect } from "@/lib/instagram/client";

export async function GET(req: NextRequest) {
  const back = (msg: string) => NextResponse.redirect(new URL(`/admin/discovery?msg=${encodeURIComponent(msg)}`, req.url));
  const user = await currentUser();
  if (!isAdmin(user)) return NextResponse.redirect(new URL("/login?next=/admin/discovery", req.url));
  const jar = await cookies();
  const state = jar.get("lm_ig_state")?.value;
  jar.delete({ name: "lm_ig_state", path: "/api/instagram" });
  const sp = req.nextUrl.searchParams;
  if (!state || sp.get("state") !== state) return back("That sign-in link expired. Try connecting again.");
  if (sp.get("error")) return back(sp.get("error_description") ?? "Facebook sign-in was cancelled.");
  const code = sp.get("code");
  if (!code) return back("Facebook didn't send a code back.");
  try {
    const username = await finishConnect(code, new URL("/api/instagram/callback", req.url).toString());
    return back(`Connected @${username}.`);
  } catch (e) {
    return back((e as Error).message);
  }
}
