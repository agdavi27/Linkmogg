import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;
function resend() {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type Mail = {
  to: string; subject: string; html: string; text: string;
  from?: string; replyTo?: string; headers?: Record<string, string>; tags?: { name: string; value: string }[];
};

/** Sends through Resend. Without RESEND_API_KEY it logs the mail and pretends success (local dev). */
export async function sendEmail(m: Mail): Promise<{ id: string }> {
  const r = resend();
  const from = m.from ?? process.env.EMAIL_FROM ?? "Linkmogg <onboarding@resend.dev>";
  if (!r) {
    console.log(`\n[email:dev] to=${m.to} from=${from}\nsubject: ${m.subject}\n${m.text}\n`);
    return { id: `dev_${Date.now()}` };
  }
  const { data, error } = await r.emails.send({
    from, to: m.to, subject: m.subject, html: m.html, text: m.text,
    replyTo: m.replyTo, headers: m.headers, tags: m.tags,
  });
  if (error || !data) throw new Error(error?.message ?? "Resend send failed");
  return { id: data.id };
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Plain, readable HTML wrapper for transactional + outreach mail. */
export function simpleHtml(paragraphs: string[], footer?: string) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55">${p}</p>`)
    .join("");
  const foot = footer
    ? `<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#6b6b6b">${footer}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:32px 20px;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;color:#1c1a17"><div style="max-width:520px;margin:0 auto">${body}${foot}</div></body></html>`;
}
