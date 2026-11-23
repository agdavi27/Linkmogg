"use server";

import { z } from "zod";
import { db, loginTokens } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/auth";
import { emailConfigured, escapeHtml, sendEmail, simpleHtml } from "@/lib/email";
import { appUrl } from "@/lib/config";

export type LoginState = { ok?: boolean; error?: string; devLink?: string; email?: string };

const schema = z.object({ email: z.email(), next: z.string().optional() });

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function requestLogin(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get("email"), next: form.get("next") || undefined });
  if (!parsed.success) return { error: "That email doesn't look right. Check it and try again." };
  const email = parsed.data.email.trim().toLowerCase();
  const token = randomToken();
  await db.insert(loginTokens).values({
    email, tokenHash: sha256(token), next: safeNext(parsed.data.next),
    expiresAt: new Date(Date.now() + 20 * 60_000),
  });
  const link = `${appUrl()}/auth/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Your Linkmogg sign-in link",
    text: `Sign in to Linkmogg: ${link}\n\nThis link works once and expires in 20 minutes. If you didn't ask for it, ignore this email.`,
    html: simpleHtml([
      "Here's your sign-in link for Linkmogg.",
      `<a href="${escapeHtml(link)}" style="display:inline-block;background:#1c1915;color:#f6f1e8;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Sign in</a>`,
      "This link works once and expires in 20 minutes. If you didn't ask for it, you can ignore this email.",
    ]),
  });
  const allowDev = !emailConfigured() && (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_LOGIN === "true");
  return { ok: true, email, devLink: allowDev ? link : undefined };
}
