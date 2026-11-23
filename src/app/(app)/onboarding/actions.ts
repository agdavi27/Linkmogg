"use server";

import { DEFAULT_THEME } from "@/themes/registry";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, pages } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizeUsername, usernameProblem } from "@/lib/reserved";

export type ClaimState = { error?: string };

export async function isUsernameFree(raw: string): Promise<{ ok: boolean; message: string }> {
  const u = normalizeUsername(raw);
  const problem = usernameProblem(u);
  if (problem) return { ok: false, message: problem };
  const [taken] = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, u)).limit(1);
  return taken ? { ok: false, message: "That one's taken." } : { ok: true, message: "It's yours if you want it." };
}

export async function claimUsername(_p: ClaimState, form: FormData): Promise<ClaimState> {
  const user = await requireUser("/onboarding");
  const u = normalizeUsername(String(form.get("username") ?? ""));
  const displayName = String(form.get("displayName") ?? "").trim().slice(0, 60);
  const problem = usernameProblem(u);
  if (problem) return { error: problem };
  const [existing] = await db.select().from(pages).where(eq(pages.userId, user.id)).limit(1);
  if (existing) redirect("/editor");
  try {
    await db.insert(pages).values({ userId: user.id, username: u, displayName: displayName || u, themeId: DEFAULT_THEME });
  } catch {
    return { error: "That one's taken. Try another." };
  }
  redirect("/editor?welcome=1");
}
