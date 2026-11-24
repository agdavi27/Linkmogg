import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// The connected account's token is stored encrypted. The key comes from META_APP_SECRET,
// so a database dump alone can't be used to call Instagram as Linkmogg.
function key() {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET isn't set.");
  return createHash("sha256").update(`linkmogg-ig-token:${secret}`).digest();
}

export function sealToken(token: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(token, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function openToken(sealed: string) {
  const [iv, tag, body] = sealed.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString("utf8");
}
