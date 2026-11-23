import { ImageResponse } from "next/og";
import { getPublicPage } from "@/lib/pages";
import { getTheme } from "@/themes/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Linkmogg page";

export default async function OG({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await getPublicPage(decodeURIComponent(username)).catch(() => null);
  const theme = getTheme(p?.themeId);
  const [bg, accent] = theme.swatch;
  const name = p ? p.data.displayName || `@${p.page.username}` : "Linkmogg";
  const dark = parseInt(bg.slice(1, 3), 16) < 120;
  const fg = dark ? "#f6f1e8" : "#1c1915";
  const links = p?.data.links.slice(0, 4) ?? [];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg, color: fg, padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {p?.data.avatarUrl ? (
              <img src={p.data.avatarUrl} width={140} height={140} style={{ borderRadius: 999, objectFit: "cover", border: `6px solid ${accent}` }} alt="" />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: 999, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 700, color: bg }}>
                {name.replace("@", "")[0]?.toUpperCase()}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{name.slice(0, 26)}</div>
              {p?.data.bio ? <div style={{ fontSize: 30, marginTop: 14, opacity: 0.75, maxWidth: 820 }}>{p.data.bio.slice(0, 90)}</div> : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 48, flexWrap: "wrap" }}>
            {links.map((l) => (
              <div key={l.id} style={{ display: "flex", padding: "14px 24px", borderRadius: 999, background: dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.07)", fontSize: 28 }}>{l.title.slice(0, 28)}</div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", right: 72, bottom: 56, display: "flex", fontSize: 26, opacity: 0.6 }}>linkmogg · {theme.name}</div>
      </div>
    ),
    size,
  );
}
